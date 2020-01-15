const createError = require('http-errors');
const transformError = require('./util.transformError');

function notFoundMiddleware(req, res, next) {
    next(createError(404));
}

const createErrorHandler = log => function (err, req, res, next) {
    if (!err.statusCode || err.statusCode >= 500)
        log(err);
    const transformed = transformError(err);
    const {statusCode} = transformed;
    if (res.headersSent)
        return next(err);
    res.status(statusCode);
    res.json(transformed);
}

module.exports = {
    notFoundMiddleware,
    createErrorHandler,
};