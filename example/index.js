const {Server} = require('http');
const WebSocket = require('ws');
const createApiUpgrade = require('../lib/server/handleUpgrade');
const {handleUpgrade: createAuthUpgrade} = require('re-authorization/lib/server/ws');
const Joi = require('@hapi/joi');
const {wrapper} = require('mongodb-reconnectable');
const dbUtils = require('../lib/server/util.db');
const express = require('express');
const createApiController = require('../lib/server/express.controller');
const createApiMiddleware = require('../lib/server/express.middleware');
const bodyParser = require('body-parser');
const createChangeChannel = require('../lib/server/channel.change');

const app = express();

const subscriptions = [];
const intervalKeys = ['createdAt'];
const distinctValuesKeys = ['username'];

const changeChannel = createChangeChannel(coll, subscriptions, intervalKeys, distinctValuesKeys);

const {wrapped, destroy, isDestroyed} = wrapper({
    url: 'mongodb://localhost:28025',
    onError: console.log,
    clientOptions: {
        replicaSet: 'rs',
    },
    onChange: function(change) {
        const {ns: {db, coll: collName}} = change;
        if (db === 'test' && collName === 'session') {
            changeChannel.put(change);
        }
    },
});

function coll() {
    return wrapped('test', 'session');
}

const server = new Server(app);
const wss = new WebSocket.Server({
    noServer: true,
    clientTracking: false,
});

const getSchemas = async function(user) {
    return {
        insert: Joi.object({
            foo: Joi.string(),
        }),
        match: Joi.object({
            username: Joi.string(),
            foo: Joi.string(),
        }),
        update: Joi.object({
            $set: Joi.object({
                foo: Joi.string(),
            }),
        }),
        del: Joi.object({
            _id: Joi.string().required().min(1),
        }).required().min(1),
    }
};

server.on('upgrade', (req, socket, head) => {
    let handled = false;
    [
        // createAuthUpgrade('foobar'),
        createApiUpgrade({
            wss, liveTime: 500000, subscriptions, pathname: '/foo', getSchemas,
        }),
        function() {
            socket.destroy();
        },
    ].forEach(handleUpgrade => {
        if (!handled && !socket.destroyed) {
            const r = handleUpgrade(req, socket, head);
            if (r === true) {
                handled = true;
            } else if (r === false) {
                socket.destroy();
            }
        }
    });
});



const router = new express.Router();
const controller = createApiController(coll, intervalKeys, distinctValuesKeys);
const middleware = createApiMiddleware(getSchemas);

app.use(bodyParser.json());

router.get('/distinct', middleware, controller.distinct);
router.get('/:_id', middleware, controller.get);
router.get('/', middleware, controller.get);
router.post('/', middleware, controller.post);
router.patch('/:_id', middleware, controller.patch);
router.patch('/', middleware, controller.patch);
router.delete('/:_id', middleware, controller.del);
router.delete('/', middleware, controller.del);

app.use('/foo', router);

server.listen(3456);
