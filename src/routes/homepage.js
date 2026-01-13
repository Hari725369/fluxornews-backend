const express = require('express');
const router = express.Router();
const HomepageConfig = require('../models/HomepageConfig');
const Article = require('../models/Article');
const { protect, requireEditorOrAbove } = require('../middleware/auth');

// @route   GET /api/homepage
// @desc    Get the current homepage configuration (Public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        let config = await HomepageConfig.findOne()
            .populate('heroArticle', 'title slug image category author createdAt')
            .populate('subFeaturedArticles', 'title slug image category author createdAt');

        if (!config) {
            // Create default config if not exists
            config = new HomepageConfig({
                breakingNews: { active: false, text: '', link: '' },
                sections: [
                    { category: 'Technology', layout: 'grid', order: 1 },
                    { category: 'World', layout: 'list', order: 2 },
                    { category: 'Sports', layout: 'carousel', order: 3 }
                ]
            });
            await config.save();
        }

        res.json(config);
    } catch (err) {
        console.error('Error fetching homepage config:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/homepage
// @desc    Update homepage configuration
// @access  Private (Editor or Higher)
router.put('/', protect, requireEditorOrAbove, async (req, res) => {
    try {
        const { heroArticle, subFeaturedArticles, breakingNews, sections } = req.body;

        let config = await HomepageConfig.findOne();
        if (!config) {
            config = new HomepageConfig();
        }

        // Validate Article IDs if provided
        if (heroArticle) {
            const heroExists = await Article.findById(heroArticle);
            if (!heroExists) return res.status(404).json({ msg: 'Hero article not found' });
            config.heroArticle = heroArticle;
        }

        if (subFeaturedArticles && Array.isArray(subFeaturedArticles)) {
            // Verify all IDs exist
            const count = await Article.countDocuments({ _id: { $in: subFeaturedArticles } });
            if (count !== subFeaturedArticles.length) {
                return res.status(404).json({ msg: 'One or more sub-featured articles not found' });
            }
            config.subFeaturedArticles = subFeaturedArticles;
        }

        if (breakingNews) config.breakingNews = breakingNews;
        if (sections) config.sections = sections;

        config.updatedBy = req.user.id;
        config.lastUpdated = Date.now();

        await config.save();

        // Return populated config
        const updatedConfig = await HomepageConfig.findById(config._id)
            .populate('heroArticle', 'title slug image category author createdAt')
            .populate('subFeaturedArticles', 'title slug image category author createdAt');

        res.json(updatedConfig);
    } catch (err) {
        console.error('Error updating homepage config:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
