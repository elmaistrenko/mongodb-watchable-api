const createError = require('http-errors');
const {ApiClient} = require('re-authorization/lib/client');
const Joi = require('@hapi/joi');
const {mapValues} = require('lodash');
const {createValidators} = require('../model.request');

module.exports = class Client extends ApiClient {
    _schemas = {};

    async schemas(pathname) {
        if (!this._schemas[pathname])
            this._schemas[pathname] = mapValues(
                await this.request({pathname: pathname + '/schemas'}),
                s => Joi.compile(s)
            );
        return this._schemas[pathname];
    }

    async validate(pathname, {match, insert, update}) {
        const validators = createValidators(await this.schemas(pathname));
        try {
            if (match)
                validators.match(match);
            if (insert)
                validators.insert(insert);
            if (update)
                validators.update(update);
            return true;
        } catch (e) {
            if (e.name === 'ValidationError')
                return e.details;
            throw e;
        }
    }

    async find(pathname, query = {}, validate = false) {
        if (validate && await this.validate(pathname, {match: query}) !== true)
            throw createError(400);
        return await this.request({pathname, query});
    }

    findById(pathname, _id) {
        if (!_id)
            throw createError(400);
        return this.request({pathname: pathname + '/' + _id});
    }

    async post(pathname, doc, validate = false) {
        if (validate && await this.validate(pathname, {insert: doc}) !== true)
            throw createError(400);
        return await this.request(pathname, {
            method: 'POST',
            body: JSON.stringify(doc),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async update(pathname, query, upd, validate = false) {
        if (validate && await this.validate(pathname, {update: upd}) !== true)
            throw createError(400);
        return await this.request({pathname, query}, {
            method: 'PATCH',
            body: JSON.stringify(upd),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    updateById(pathname, _id, upd) {
        if (!_id)
            throw createError(400);
        return this.request(pathname + '/' + _id, {
            method: 'PATCH',
            body: JSON.stringify(upd),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    del(pathname, query) {
        return this.request({pathname, query}, {
            method: 'DELETE',
        })
    }

    delById(pathname, _id) {
        if (!_id)
            throw createError(400);
        return this.request(pathname + '/' + _id, {
            method: 'DELETE',
        })
    }

    distinct(pathname, distinctKey, query) {
        return this.request({pathname: pathname + '/distinct', query: {...query, distinctKey}}, {
            method: 'GET',
        })
    }
};
