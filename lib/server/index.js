const {middleware: createOpenApiMiddleware, endpoint: openapiEndpoint} = require('./express.openapi');
const {notFoundMiddleware, createErrorHandler} = require('./express.error');

module.exports = {
    createApiParts: require('./apiParts'),
    onUpgrade: require('./onUpgrade'),
    createOpenApiMiddleware,
    openapiEndpoint,
    notFoundMiddleware,
    createErrorHandler,
};