const {channel, buffers, runSaga} = require('redux-saga');
const {throttle} = require('redux-saga/effects');
const find = require('./util.find');

module.exports = function (getColl, subscriptions, intervalKeys, distinctKeys) {
    const chan = channel(buffers.sliding(1));

    runSaga({
        channel: chan,
        dispatch(output) {
        },
        getState() {
        },
    }, function* () {
        yield throttle(500, () => true, function* () {
            getColl().then(coll => {
                subscriptions.forEach(({query, callbacks}) => {
                    find.apply(coll, [query, intervalKeys, distinctKeys])
                        .then(data => callbacks.forEach(c => c(data)));
                });
            });
        });
    });

    return chan;
};
