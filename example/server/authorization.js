const createRouter = require('re-authorization/lib/server/express.router');
const createMiddleware = require('re-authorization/lib/server/express.middleware');
const createSessionStorage = require('re-authorization/lib/server/sessionStorage');
const {handleUpgrade: createAuthUpgrade} = require('re-authorization/lib/server/ws');

const accessSecret = 'qwerty';
const refreshSecret = 'qwerty1';

module.exports = function(getColl) {
    const sessionStorage = createSessionStorage(getColl);
    const router = createRouter({
        refreshSecret,
        accessSecret,
        checkCredentials: async ({username, password}) => username === password,
        sessionStorage,
    });
    const handleUpgrade = createAuthUpgrade(accessSecret);

    return {
        middleware: createMiddleware(accessSecret),
        router,
        handleUpgrade,
    }
};