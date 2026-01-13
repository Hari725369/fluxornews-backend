const ArticleService = require('../services/articleService');

class ArticleController {
    // @route   GET /api/articles
    // @desc    Get all articles with pagination and filters
    async getArticles(req, res, next) {
        try {
            const result = await ArticleService.listArticles(req.query, req.user);
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   GET /api/articles/:slug
    // @desc    Get single article by slug
    async getArticleBySlug(req, res, next) {
        try {
            const article = await ArticleService.getBySlug(req.params.slug, req.user);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
            }

            res.json({
                success: true,
                data: article,
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   GET /api/articles/:id/related
    // @desc    Get related articles
    async getRelatedArticles(req, res, next) {
        try {
            const related = await ArticleService.getRelatedArticles(req.params.id);

            if (!related) {
                return res.status(404).json({ success: false, message: 'Article not found' });
            }

            res.json({
                success: true,
                data: related
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ArticleController();
