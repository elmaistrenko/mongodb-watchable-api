const INTERNAL_SERVER_ERROR = 'Internal Server Error';
const VALIDATION_ERROR = 'ValidationError';

module.exports = function (err) {
    const r = {};
    if (err.name === VALIDATION_ERROR)
        err.statusCode = err.statusCode || 400;
    if (err.details)
        r.details = err.details;
    const statusCode = err.statusCode || 500;
    // if (statusCode >= 500) {
    //     const {errorChannel} = this;
    //     errorChannel.put(err);
    // }
    const message = err.statusCode && err.statusCode !== 500 ? err.message : INTERNAL_SERVER_ERROR;
    r.statusCode = statusCode;
    r.message = message;
    return r;
}
