const {createStore, queryData} = require('../../lib/client/store');
const {MemoryStore} = require('re-authorization/lib/client');
const Client = require('../../lib/client/api');


const client = new Client({
    base: 'http://localhost:3456',
    store: new MemoryStore({
        refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVkZW50aWFscyI6eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJyZW1lbWJlciI6dHJ1ZX0sInNlc3Npb25JZCI6IjVlMWVlODhkYzNlZmU1NTU2NWZjOTUxNSIsInJlbWVtYmVyIjp0cnVlLCJpYXQiOjE1NzkwODM5MTcsImV4cCI6MTg5NDQ0MzkxN30.PX1ooP1Fw31QND4Osn0xV5mM1QXgPdHqudvA9XH9ykA'
    }),
    pathname: '/cats',
});

const pathname = '/cats';

const store = createStore(client, pathname, false);

store.subscribe(() => console.log(store.getState()));

store.dispatch(queryData());

// client.request('/cats/schemas').then(console.log);

// client.find('/cats').then(console.log);
