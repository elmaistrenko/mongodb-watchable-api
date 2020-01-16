const Joi = require('@hapi/joi');
const {idSchema} = require('../../lib/model.request');

const dbName = 'test';
const collName = 'cat';
const name = 'Cat';
const pathname = '/cats';
const metaKeys = {
    distinctValues: ['name'],
};

async function getSchemas(user) {
    const document = (update = false) => {
        let name = Joi.string().empty();
        if (!update) {
            name = name.required();
        }
        return Joi.object({
            name,
        }).required().min(1);
    };
    return {
        document: document(),
        updateMatch: Joi.object({
            _id: Joi.alternatives().try(idSchema.required(), Joi.object({
                $in: Joi.array().items(idSchema.required()).required().min(1),
            })).required(),
        }).required().min(1),
        deleteMatch: Joi.object({
            _id: Joi.alternatives().try(idSchema.required(), Joi.object({
                $in: Joi.array().items(idSchema.required()).required().min(1),
            })).required(),
        }).required().min(1),
        match: Joi.object({
            name: Joi.string(),
        }),
        update: Joi.object({
            $set: document(true),
        }),
    }
}

getSchemas().then(c => console.log(c.match.describe()));

module.exports = {
    dbName,
    collName,
    getSchemas,
    name,
    pathname,
    metaKeys,
};
