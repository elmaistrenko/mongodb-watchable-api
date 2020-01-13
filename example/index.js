const {Server} = require('http');
const WebSocket = require('ws');
const createApiUpgrade = require('../lib/server/handleUpgrade');
const {handleUpgrade: createAuthUpgrade} = require('re-authorization/lib/server/ws');
const {wrapper} = require('mongodb-reconnectable');
const express = require('express');
const createApiRouter = require('../lib/server/express.router');
const bodyParser = require('body-parser');
const cors = require('cors');
const createOnChange = require('../lib/server/onChange');
const {middleware: createOpenApiMiddleware, endpoint: openapiEndpoint} = require('../lib/server/express.openapi');
const {authPaths, securitySchemes, security} = require('re-authorization/lib/server/util.openapi');
const createFoo = require('./resources/foo');

const app = express();



const foo = createFoo(getFooColl);
const {changeChannel, getSchemas, metaKeys} = foo;

const {wrapped, destroy, isDestroyed} = wrapper({
    url: 'mongodb://localhost:28025',
    onError: console.log,
    clientOptions: {
        replicaSet: 'rs',
    },
    onChange: function (change) {
        createOnChange('test', 'session', changeChannel)(change);
    },
});

function getFooColl() {
    return wrapped('test', 'session');
}

const server = new Server(app);
const wss = new WebSocket.Server({
    noServer: true,
    clientTracking: false,
});


const onUpgrade = require('../lib/server/onUpgrade');
onUpgrade.apply(server, [
    [
        // createAuthUpgrade('foobar'),
        createApiUpgrade({
            wss,
            liveTime: 500000,
            ...foo,
        }),
    ]
]);

app.use(cors());
app.use(bodyParser.json());



app.use('/foo', createApiRouter(getFooColl, getSchemas, metaKeys));

app.get('/openapi', createOpenApiMiddleware({
    openapi: '3.0.0',
    info: {
        title: 'some api',
        version: '1.0.0',
        description: 'some description',
    },
    servers: [
        {url: 'http://localhost:3456'},
    ],
    components: {
        securitySchemes,
    },
    paths: authPaths('', 'Authorization'),
}, security, foo), openapiEndpoint);



server.listen(3456);
