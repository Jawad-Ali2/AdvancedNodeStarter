const { clearHash } = require('../services/cache');


module.exports = async (req, res, next) => {
    await next();

    clearHash(req.user.id); // Clear cache for the user after the request is processed
}