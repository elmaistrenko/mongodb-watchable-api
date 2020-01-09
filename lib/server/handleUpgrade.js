const parseUrl = require('parseurl');
const qs = require('qs');
const {createValidator} = require('../model.request');


module.exports = ({wss, pathname, getSchemas, liveTime, subscriptions}) => function (req, socket, head) {
    let query;
    try {
        const parsed = parseUrl(req);
        query = qs.parse(parsed.query);
        if (pathname !== parsed.pathname)
            return;
    } catch (e) {
        return;
    }
    const {user} = req;
    getSchemas(user).then(({matchSchema}) => {
        const validate = createValidator(undefined, undefined, matchSchema);
        const validated = validate(query, true, true, false);
        wss.handleUpgrade(req, socket, head, function (ws) {
            function onChange(data) {
                ws.send(JSON.stringify(data));
            }
            subscriptions.push({
                onChange,
                query: validated,
            });
            ws.on('close', () => {
                const index = subscriptions.findIndex(s => s.onChange === onChange);
                subscriptions.splice(index, 1);
            });
            if (liveTime)
                setTimeout(function() {
                    ws.close(1000);
                }, liveTime);
        });
    }).catch(() => {
        socket.destroy();
    });

    return true;
};
