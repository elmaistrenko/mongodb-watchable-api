const Joi = require('@hapi/joi');
const {omit} = require('lodash');

const id = Joi.string().regex(/^[0-9a-fA-F]{24}$/);
const fieldPattern = /^[\w\d_.]+$/;
const field = Joi.string().pattern(fieldPattern);

const optionsSchema = Joi.object({
    meta: Joi.boolean().default(false),
    isOne: Joi.boolean().default(false),
    distinctKey: field,
    page: Joi.number().greater(0).default(1),
    perPage: Joi.number().greater(0).less(100).default(100),
    sort: Joi.object().pattern(fieldPattern, Joi.number().valid(-1, 1)).default({createdAt: -1}),
    groupBy: Joi.alternatives().try(field, Joi.array().min(1).items(field)),
});

const matchKeys = {
    _id: Joi.alternatives().try(id, Joi.object({
        $in: Joi.array().items(id),
    })),
    isDeleted: Joi.any().forbidden(),
};

const forbiddenKeys = {
    _id: Joi.any().forbidden(),
    isDeleted: Joi.any().forbidden(),
    createdAt: Joi.any().forbidden(),
    updatedAt: Joi.any().forbidden(),
};

const createValidators = schemas => {
    function options(obj) {
        const {value, error} = optionsSchema.validate(obj, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        });
        if (error)
            throw error;
        return value;
    }

    function match(obj) {
        const {value, error} = schemas.match.keys(matchKeys).default({}).validate(
            omit(obj, Object.keys(optionsSchema.describe().keys).concat(['document'])),
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        value.isDeleted = {$ne: true};
        return value;
    }

    function insert(obj) {
        const {value, error} = schemas.insert.keys(forbiddenKeys).validate(
            obj.document || obj,
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        return value;
    }

    function update(obj) {
        const {value, error} = schemas.update.keys(forbiddenKeys).validate(
            obj.update || obj,
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        value.isDeleted = {$ne: true};
        return value;
    }

    function del(obj) {
        const {value, error} = schemas.del.validate(
            obj.update || obj,
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        value.isDeleted = {$ne: true};
        return value;
    }

    return {
        options,
        match,
        insert,
        update,
        del,
    }
};

module.exports = {
    optionsSchema,
    matchKeys,
    createValidators,
};
