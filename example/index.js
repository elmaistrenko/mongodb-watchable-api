const {Server} = require('http');
const parseUrl = require('parseurl');
const qs = require('qs');
const {fromPairs} = require('lodash');



const server = new Server();

server.on('upgrade', req => {
    const queryparse = qs.parse;
    console.log(parseUrl(req))
});

server.listen(3456);
