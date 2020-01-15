const parseUrl = require('parseurl');
const qs = require('qs');
const {omit, isEqual} = require('lodash');
const {TOKEN_KEY} = require('re-authorization/lib/server/ws');
const {createValidators} = require('../model.request');

module.exports = ({wss, pathname, getSchemas, liveTime, subscriptions, errorHandler}) => function (req, socket, head) {
    let query;
    try {
        const parsed = parseUrl(req);
        query = omit(qs.parse(parsed.query), [TOKEN_KEY]);
        if (pathname !== parsed.pathname)
            return;
    } catch (e) {
        return;
    }
    const {user} = req;
    getSchemas(user).then((schemas) => {
        const validators = createValidators(schemas);
        const options = validators.options(query);
        const match = validators.match(query);
        wss.handleUpgrade(req, socket, head, function (ws) {
            function onChange(data) {
                ws.send(JSON.stringify(data));
            }

            let index = subscriptions.findIndex(({query}) => isEqual(query, {options, match}));
            if (index === -1) {
                index = subscriptions.push({
                    query: {options, match},
                    callbacks: [],
                }) - 1;
            }
            subscriptions[index].callbacks.push(onChange);
            ws.on('close', () => {
                let index = subscriptions.findIndex(({query}) => isEqual(query, {options, match}));
                const i = subscriptions[index].callbacks.findIndex(s => s.onChange === onChange);
                subscriptions[index].callbacks.splice(i, 1);
                if (!subscriptions[index].callbacks.length)
                    subscriptions.splice(index, 1);
            });
            if (liveTime)
                setTimeout(function () {
                    ws.close(1000);
                }, liveTime);
        });
    }).catch(e => {
        errorHandler(e);
        socket.destroy();
    });

    return true;
};
