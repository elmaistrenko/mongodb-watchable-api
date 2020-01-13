const createError = require('http-errors');
const db = require('./util.db');
const find = require('./util.find');

module.exports = (getColl, intervalKeys, distinctKeys) => {
    async function get(req, res, next) {
        try {
            const collection = await getColl();
            const {options: {isOne}} = req.apiQuery;
            const r = await find.apply(collection, [req.apiQuery, intervalKeys, distinctKeys]);
            if (isOne && !r)
                return next(createError(404));
            await res.json(r);
        } catch (e) {
            next(e);
        }
    }

    async function post(req, res, next) {
        try {
            const collection = await getColl();
            const r = await db.insert.apply(collection, [req.apiQuery]);
            await res.json(r);
        } catch (e) {
            next(e);
        }
    }

    async function patch(req, res, next) {
        try {
            const collection = await getColl();
            const r = await db.update.apply(collection, [req.apiQuery]);
            await res.json(r);
        } catch (e) {
            next(e);
        }
    }

    async function del(req, res, next) {
        try {
            const collection = await getColl();
            const r = await db.del.apply(collection, [req.apiQuery]);
            await res.json(r);
        } catch (e) {
            next(e);
        }
    }

    async function distinct(req, res, next) {
        try {
            const {options: {distinctKey}, match} = req.apiQuery;
            if (!distinctKey)
                return next(createError(400));
            const collection = await getColl();
            await res.json(await collection.distinct(distinctKey, match));
        } catch (e) {
            next(e);
        }
    }

    return {
        get,
        post,
        patch,
        del,
        distinct,
    }
};
