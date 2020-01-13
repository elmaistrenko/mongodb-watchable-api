const createChangeChannel = require('../../lib/server/channel.change');
const Joi = require('@hapi/joi');
const {idSchema} = require('../../lib/model.request');

module.exports = (getColl) => {
    const subscriptions = [];
    const metaKeys = {
        interval: ['createdAt'],
        distinctValues: ['username'],
    };

    const changeChannel = createChangeChannel(getColl, subscriptions, metaKeys);
    const pathname = 'foo';
    const name = 'Foo';

    const getSchemas = async function (user) {
        const document = (update = false) => {
            let foo = Joi.string().empty();
            if (!update)
                foo = foo.required();
            return Joi.object({
                foo,
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
                foo: Joi.string(),
            }),
            update: Joi.object({
                $set: document(true),
            }),
        }
    };

    return {
        subscriptions,
        changeChannel,
        pathname,
        name,
        getSchemas,
        metaKeys,
    }
};
