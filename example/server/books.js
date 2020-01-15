const Joi = require('@hapi/joi');
const {idSchema} = require('../../lib/model.request');

const dbName = 'test';
const collName = 'book';
const name = 'Book';
const pathname = '/books';
const metaKeys = {
    distinctValues: ['author'],
};

async function getSchemas(user) {
    const document = (update = false) => {
        let title = Joi.string().empty();
        let author = Joi.string().empty();
        if (!update) {
            title = title.required();
            author = author.required();
        }
        return Joi.object({
            title,
            author,
        }).required().min(1);
    };
    return {
        document,
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
            title: Joi.string().required(),
            author: Joi.string(),
        }),
        update: Joi.object({
            $set: document(true),
        }),
    }
}

module.exports = {
    dbName,
    collName,
    getSchemas,
    name,
    pathname,
    metaKeys,
};