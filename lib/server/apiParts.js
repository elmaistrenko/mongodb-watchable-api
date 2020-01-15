const createApiUpgrade = require('./handleUpgrade');
const createApiRouter = require('./express.router');
const createOnChange = require('./onChange');
const createChangeChannel = require('./channel.change');

/**
 * @param {object} config
 * @param {object} config.dbWrapper
 * @param {string} config.dbName
 * @param {string} config.collName
 * @param {object} [config.metaKeys={}]
 * @param {string[]} [config.metaKeys.intervals]
 * @param {string[]} [config.metaKeys.distinctValues]
 * @param {string} config.pathname
 * @param {string} config.name
 * @param {function} config.getSchemas
 * @param {object} config.wss
 * @param {number} [config.wsLiveTime]
 * @param {boolean} [config.watch=true]
 * @param {function} [config.errorHandler]
 * @param {function[]} [config.routerMiddleware=[]]
 * @returns {{openApiResource: {name: *, getSchemas: *, pathname: *}, changeChannel, expressRouter: router, upgradeHandler: (function(*=, *=, *=): boolean), pathname: boolean}}
 */
module.exports = function(config) {
    const {
        dbWrapper,
        dbName,
        collName,
        metaKeys = {},
        pathname,
        name,
        getSchemas,
        watch = true,
        wss,
        wsLiveTime: liveTime,
        routerMiddleware = [],
        errorHandler = console.log,
    } = config;

    function getColl() {
        return dbWrapper.wrapped(dbName, collName);
    }

    const subscriptions = [];

    const upgradeHandler = createApiUpgrade({
        wss,
        getSchemas,
        liveTime,
        pathname,
        subscriptions,
        errorHandler,
    });

    const expressRouter = createApiRouter(getColl, getSchemas, metaKeys, ...routerMiddleware);

    const openApiResource = {name, pathname, getSchemas};

    const changeChannel = createChangeChannel(getColl, subscriptions, metaKeys, errorHandler);
    const onChange = createOnChange(dbName, collName, changeChannel);
    if (watch)
        dbWrapper.onChange(onChange);

    return {
        pathname,
        expressRouter,
        openApiResource,
        upgradeHandler,
        changeChannel,
    };
};