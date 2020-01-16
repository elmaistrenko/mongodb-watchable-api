const {Router} = require('express');
const createApiController = require('./express.controller');
const createApiMiddleware = require('./express.middleware');

module.exports = (getColl, getSchemas, metaKeys, ...middlewares) => {
    const {interval, distinctValues} = metaKeys || {};
    const router = new Router();
    const controller = createApiController(getColl, interval, distinctValues, getSchemas);
    const middleware = createApiMiddleware(getSchemas);

    router.get('/distinct', ...middlewares, middleware, controller.distinct);
    router.get('/schemas', ...middlewares, controller.schemas);
    router.get('/:_id', ...middlewares, middleware, controller.get);
    router.get('/', ...middlewares, middleware, controller.get);
    router.post('/', ...middlewares, middleware, controller.post);
    router.patch('/:_id', ...middlewares, middleware, controller.patch);
    router.patch('/', ...middlewares, middleware, controller.patch);
    router.delete('/:_id', ...middlewares, middleware, controller.del);
    router.delete('/', ...middlewares, middleware, controller.del);

    return router;
};
