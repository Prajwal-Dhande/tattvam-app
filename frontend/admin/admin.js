// ==========================================================
// ===          SHARED HELPER FUNCTIONS (Your Code)       ===
// ==========================================================

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Displays a notification toast.
 * @param {string} message The message to display.
 * @param {string} type 'info', 'success', or 'error'.
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        // Create a toast container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-[110] space-y-2';
        document.body.appendChild(container);
    }

    const icons = { info: 'fa-info-circle', success: 'fa-check-circle', error: 'fa-exclamation-triangle' };
    const colors = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500' };
    const toast = document.createElement('div');
    // Using a simple fade-in/out animation
    toast.className = `flex items-center gap-3 ${colors[type]} text-white py-2 px-4 rounded-lg shadow-lg transition-opacity duration-300 opacity-0`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><p>${message}</p>`;
    document.getElementById('toast-container').appendChild(toast);
    
    // Fade in
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 100);

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


/**
 * Logs the admin out, removes the token, and redirects to the login page.
 */
function handleLogout() {
    localStorage.removeItem('adminToken');
    showToast('You have been logged out.', 'info');
    window.location.href = 'admin.html';
}

/**
 * Checks if an admin token exists. If not, redirects to the login page.
 * @returns {string|null} The token if it exists, otherwise null.
 */
function checkAdminLogin() {
    const token = localStorage.getItem('adminToken');
    if (!token && !window.location.pathname.endsWith('admin.html')) {
        window.location.href = 'admin.html';
        return null;
    }
    return token;
}

/**
 * Returns the authorization headers for an API request.
 * @returns {HeadersInit}
 */
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}


// ==========================================================
// ===  MAIN LOGIC FOR PRODUCT APPROVAL PAGE (Added Code) ===
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Only run this logic on the admin-products page
    if (window.location.pathname.endsWith('admin-products.html')) {
        
        // First, check if admin is logged in
        checkAdminLogin();

        const productTableBody = document.getElementById('product-queue-body');
        
        // Fetch pending products from the backend
        const fetchPendingProducts = async () => {
            productTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4">Loading...</td></tr>`;
            try {
                const response = await fetch(`${API_BASE_URL}/admin/products/pending`, {
                    headers: getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to fetch products');
                const products = await response.json();
                renderProductTable(products);
            } catch (error) {
                console.error('Error:', error);
                productTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 p-4">Error loading products.</td></tr>`;
            }
        };

        // Render the products into the HTML table
        const renderProductTable = (products) => {
            productTableBody.innerHTML = '';
            if (products.length === 0) {
                productTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-4">No products are currently pending approval.</td></tr>`;
                return;
            }
            products.forEach(product => {
                const row = document.createElement('tr');
                row.className = 'border-b';
                const imageUrl = product.imageUrl ? `${API_BASE_URL.replace('/api', '')}/${product.imageUrl.replace(/\\/g, '/')}` : '';
                row.innerHTML = `
                    <td class="p-2"><img src="${imageUrl}" alt="${product.name}" class="w-16 h-16 object-cover rounded-md"></td>
                    <td class="p-2 font-semibold">${product.name}</td>
                    <td class="p-2">${product.brand}</td>
                    <td class="p-2"><span class="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">${product.status}</span></td>
                    <td class="p-2">
                        <button data-id="${product._id}" class="approve-btn px-3 py-1 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600">Approve</button>
                        <button data-id="${product._id}" class="reject-btn px-3 py-1 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 ml-2">Reject</button>
                    </td>
                `;
                productTableBody.appendChild(row);
            });
        };
        
        // --- Handlers for Approve/Reject Actions ---
        const approveProduct = async (productId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/products/approve/${productId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                });
                if (!response.ok) throw new Error('Failed to approve product');
                showToast('Product approved successfully!', 'success');
                fetchPendingProducts(); // Refresh the list
            } catch (error) {
                showToast(error.message, 'error');
            }
        };

        const rejectProduct = async (productId) => {
             try {
                const response = await fetch(`${API_BASE_URL}/admin/products/reject/${productId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                });
                if (!response.ok) throw new Error('Failed to reject product');
                showToast('Product rejected successfully.', 'info');
                fetchPendingProducts(); // Refresh the list
            } catch (error) {
                showToast(error.message, 'error');
            }
        };
        
        // --- Event Listener for Clicks on the Table ---
        productTableBody.addEventListener('click', (e) => {
            const target = e.target;
            const productId = target.dataset.id;
            
            if (productId && target.classList.contains('approve-btn')) {
                if (confirm('Are you sure you want to approve this product?')) {
                    approveProduct(productId);
                }
            }
            
            if (productId && target.classList.contains('reject-btn')) {
                 if (confirm('Are you sure you want to reject this product?')) {
                    rejectProduct(productId);
                }
            }
        });

        // Initial fetch of products when the page loads
        fetchPendingProducts();
    }
});