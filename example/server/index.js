const {Server} = require('http');
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {wrapper} = require('mongodb-reconnectable');


const {
    createApiParts,
    createOpenApiMiddleware,
    openapiEndpoint,
    notFoundMiddleware,
    createErrorHandler,
    onUpgrade,
} = require('../../lib/server');

const errorHandler = console.log;

const dbWrapper = wrapper({
    url: 'mongodb://5.53.125.201:28025',
    onError: errorHandler,
    clientOptions: {
        replicaSet: 'rs',
    },
});

const app = express();
const server = new Server(app);
app.use(cors());
app.use(bodyParser.json(), bodyParser.text());
const wss = new WebSocket.Server({
    noServer: true,
    clientTracking: false,
});

const resources = [require('./books'), require('./cats')].map(config => createApiParts({
    ...config,
    wss,
    wsLiveTime: 30000,
    dbWrapper,
    errorHandler,
}));

function getSessionColl() {
    return dbWrapper.wrapped('test', 'session');
}

const auth = require('./authorization')(getSessionColl);

onUpgrade.apply(server, [
    [
        auth.handleUpgrade,
        ...resources.map(r => r.upgradeHandler),
    ]
]);

app.use(auth.router);

resources.forEach(r => app.use(r.pathname, auth.middleware, r.expressRouter));

app.get('/openapi', createOpenApiMiddleware(
    require('./openapi'),
    false,
    ...resources.map(r => r.openApiResource)
), openapiEndpoint);

app.use(notFoundMiddleware);
app.use(createErrorHandler(errorHandler));

server.listen(3456);
