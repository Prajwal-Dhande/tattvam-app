// ... (all your other imports)
const productRoutes = require('./routes/productRoutes.js');
const scanRoutes = require('./routes/scanRoutes.js');
const analyticsRoutes = require('./routes/analyticsRoutes.js'); // MAKE SURE THIS LINE IS UNCOMMENTED

const app = express();
// ... (all your middleware)

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/analytics', analyticsRoutes); // MAKE SURE THIS LINE IS UNCOMMENTED

// ... (rest of your server.js file)

