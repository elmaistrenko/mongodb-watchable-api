const {set} = require('lodash');
const Joi = require('@hapi/joi');
const {
    findById,
    find,
    post,
    patchById,
    patch,
    delById,
    del,
    distinct,
} = require('./util.oapi');
const {joi2oapi} = require('re-authorization/lib/server/util.openapi');

const middleware = (initial, security, ...resources) => async function (req, res, next) {
    try {
        const paths = {}, schemas = {};
        for (const {name, pathname, getSchemas} of resources) {
            const resourceSchemas = await getSchemas(req.user);
            const documentSchema = resourceSchemas.document().keys({
                createdAt: Joi.date(),
                updatedAt: Joi.date(),
            });
            schemas[name] = joi2oapi(documentSchema);
            set(paths, `${pathname}/{_id}.get`, findById(pathname, name, security));
            set(paths, `${pathname}.get`, find(pathname, name, resourceSchemas, security));
            set(paths, `${pathname}.post`, post(pathname, name, resourceSchemas, security));
            set(paths, `${pathname}/{_id}.patch`, patchById(pathname, name, resourceSchemas, security));
            set(paths, `${pathname}.patch`, patch(pathname, name, resourceSchemas, security));
            set(paths, `${pathname}/{_id}.delete`, delById(pathname, name, resourceSchemas, security));
            set(paths, `${pathname}.delete`, del(pathname, name, resourceSchemas, security));
            set(paths, `${pathname}/distinct.get`, distinct(pathname, name, resourceSchemas, security));
        }
        req.openapi = {
            ...initial,
            paths: {
                ...(initial || {}).paths,
                ...paths,
            },
            components: {
                ...(initial || {}).components,
                schemas: {
                    ...((initial || {}).components || {}).schemas,
                    ...schemas,
                },
            },
        };
        next();
    } catch (e) {
        next(e);
    }
};

async function endpoint(req, res, next) {
    try {
        await res.json(req.openapi);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    middleware,
    endpoint,
};
