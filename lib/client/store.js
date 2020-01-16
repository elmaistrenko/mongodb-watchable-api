const {createStore: cs, applyMiddleware} = require('redux');
const {default: createSagaMiddleware, channel, buffers, END} = require('redux-saga');
const {throttle, call, select, put, takeEvery, fork, race, take, delay} = require('redux-saga/effects');

const initialState = (isOne = false) => ({
    data: null,
    items: [],
    count: isOne ? null : 0,
    match: {},
    options: {
        page: 1,
        perPage: 100,
        sort: {createdAt: -1},
        meta: true,
        isOne,
    },
    distinctValues: {},
    distinctValuesByQuery: {},
    intervals: {},
    intervalsByQuery: {},
});

const SET_MATCH = 'SET_MATCH';
const SET_PAGE = 'SET_PAGE';
const SET_PER_PAGE = 'SET_PER_PAGE';
const SET_SORT = 'SET_SORT';
const SET_DATA = 'SET_DATA';
const QUERY_DATA = 'QUERY_DATA';

module.exports = {
    createStore,
    queryData,
    setMatch,
    setPage,
    setPerPage,
    setSort,
    SET_MATCH,
    SET_PAGE,
    SET_PER_PAGE,
    SET_SORT,
    SET_DATA,
};

function queryData() {
    return {type: QUERY_DATA};
}

function setMatch(payload) {
    return {type: QUERY_DATA, payload};
}

function setPage(value) {
    return {type: QUERY_DATA, payload: value};
}

function setPerPage(value) {
    return {type: QUERY_DATA, payload: value};
}

function setSort(payload) {
    return {type: QUERY_DATA, payload};
}

function createStore(client, pathname, isOne, onError = console.error) {
    const sagaMiddleware = createSagaMiddleware();
    const store = cs(createReducer(isOne), applyMiddleware(
        sagaMiddleware,
    ));
    sagaMiddleware.run(createSaga(client, pathname, onError));
    return store;
}

function createSaga(client, pathname, onError) {
    return function* () {
        yield fork(function* () {
            const chan = channel(buffers.sliding(1));
            yield takeEvery(chan, function* (action) {
                yield put(action);
            });
            while (true) {
                let socket;
                try {
                    const query = yield select(state => ({...state.match, ...state.options}));
                    socket = yield call([client, client.wsRequest], {pathname, query});
                    socket.onmessage = function ({data}) {
                        const payload = JSON.parse(data);
                        chan.put({type: SET_DATA, payload});
                    };
                    yield race([
                        call(() => new Promise(resolve => {
                            socket.onclose = resolve;
                        })),
                        take([SET_SORT, SET_PAGE, SET_PER_PAGE, SET_MATCH]),
                    ]);
                } catch (e) {
                    if (e.statusCode === 401) {
                        while (true) {
                            if(yield call(async () => await client.authorized() !== false) === true)
                                break;
                        }
                    } else {
                        onError(e);
                    }
                    delay(1000);
                } finally {
                    if (socket)
                        socket.close();
                }
            }
        });
        yield throttle(2000, QUERY_DATA, function* () {
            try {
                const query = yield select(state => ({...state.match, ...state.options}));
                const payload = yield call([client, client.find], pathname, query);
                yield put({type: SET_DATA, payload});
            } catch (e) {
                onError(e);
            }
        });
        yield takeEvery([SET_SORT, SET_PAGE, SET_PER_PAGE, SET_MATCH], function* () {
            yield put(queryData());
        });
    };
}

function createReducer(isOne) {
    return function (state = initialState(isOne), action) {
        const {type, payload} = action;
        switch (type) {
            case SET_MATCH:
                return {...state, match: payload};
            case SET_PAGE:
                return {...state, options: {...state.options, page: payload}};
            case SET_PER_PAGE:
                return {...state, options: {...state.options, perPage: payload}};
            case SET_SORT:
                return {...state, options: {...state.options, sort: payload}};
            case SET_DATA:
                return {...state, ...payload};
            default:
                return state;
        }
    }
}


