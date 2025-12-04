const Scan = require('../models/Scan.js');

// @desc    Get summary of user's scans (ratings breakdown and weekly trend)
// @route   GET /api/analytics/summary
const getAnalyticsSummary = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. --- RATING SUMMARY ---
        const allScans = await Scan.find({ user: userId });
        
        let healthy = 0;
        let moderate = 0;
        let unhealthy = 0;

        allScans.forEach(scan => {
            if (scan.rating >= 4) {
                healthy++;
            } else if (scan.rating >= 2.5) {
                moderate++;
            } else {
                unhealthy++;
            }
        });

        // 2. --- WEEKLY TREND ---
        const labels = [];
        const data = [0, 0, 0, 0, 0, 0, 0]; // Data for the last 7 days
        const dateMap = new Map(); // To easily map dates to array indices

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
            labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
            dateMap.set(dateString, 6 - i);
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentScans = await Scan.find({ user: userId, createdAt: { $gte: sevenDaysAgo } });

        recentScans.forEach(scan => {
            const scanDateString = scan.createdAt.toISOString().split('T')[0];
            if (dateMap.has(scanDateString)) {
                const index = dateMap.get(scanDateString);
                data[index]++;
            }
        });

        res.json({
            ratingSummary: { healthy, moderate, unhealthy },
            weeklyTrend: { labels, data },
        });

    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's achievements
// @route   GET /api/analytics/achievements
const getAchievements = async (req, res) => {
    try {
        const userId = req.user._id;
        const scans = await Scan.find({ user: userId });

        // --- DEFINE ALL POSSIBLE ACHIEVEMENTS ---
        const achievementsList = [
            { id: 1, title: 'First Scan', description: 'Scan your first item', icon: 'fas fa-camera', earned: false },
            { id: 2, title: '5 Scans', description: 'Scan 5 different items', icon: 'fas fa-list-ol', earned: false },
            { id: 3, title: 'Health Starter', description: 'Scan a healthy item', icon: 'fas fa-seedling', earned: false },
            { id: 4, title: 'Variety Scannner', description: 'Scan 3+ different brands', icon: 'fas fa-tags', earned: false },
            { id: 5, title: 'Health Nut', description: 'Scan 5 healthy items', icon: 'fas fa-carrot', earned: false },
            { id: 6, title: 'Curious Cat', description: 'Scan an unhealthy item', icon: 'fas fa-cookie-bite', earned: false },
        ];

        // --- CALCULATE STATS ---
        const scanCount = scans.length;
        const healthyCount = scans.filter(s => s.rating >= 4).length;
        const unhealthyCount = scans.filter(s => s.rating < 2.5).length;
        const uniqueBrands = new Set(scans.map(s => s.productBrand)).size;

        // --- CHECK ACHIEVEMENTS ---
        if (scanCount > 0) achievementsList[0].earned = true;
        if (scanCount >= 5) achievementsList[1].earned = true;
        if (healthyCount > 0) achievementsList[2].earned = true;
        if (uniqueBrands >= 3) achievementsList[3].earned = true;
        if (healthyCount >= 5) achievementsList[4].earned = true;
        if (unhealthyCount > 0) achievementsList[5].earned = true;
        
        res.json(achievementsList);

    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAnalyticsSummary,
    getAchievements,
};
