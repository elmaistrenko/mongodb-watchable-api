const Joi = require('@hapi/joi');
const {omit} = require('lodash');

const idSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/);
const fieldPattern = /^[\w\d_.]+$/;
const field = Joi.string().pattern(fieldPattern);

const optionsSchema = Joi.object({
    meta: Joi.boolean().default(false),
    isOne: Joi.boolean().default(false),
    distinctKey: field,
    page: Joi.number().greater(0).default(1),
    perPage: Joi.number().greater(0).less(101).default(100),
    sort: Joi.object().pattern(fieldPattern, Joi.number().valid(-1, 1)).default({createdAt: -1}),
    groupBy: Joi.alternatives().try(field, Joi.array().min(1).items(field)),
});

const matchKeys = {
    _id: Joi.alternatives().try(idSchema, Joi.object({
        $in: Joi.array().items(idSchema),
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

    const optionsKeys = Object.keys(optionsSchema.describe().keys);

    function match(obj) {
        const {value, error} = schemas.match.keys(matchKeys).default({}).validate(
            omit(obj, optionsKeys),
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        return value;
    }

    const document = schemas.document.keys(forbiddenKeys);

    function insert(obj) {
        const {value, error} = Joi.alternatives(document, Joi.array().items(document).required().min(1)).validate(
            obj,
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
            obj,
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        return value;
    }

    function updateMatch(obj) {
        const {value, error} = schemas.updateMatch.keys(omit(forbiddenKeys, ['_id'])).validate(
            omit(obj, optionsKeys),
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        return value;
    }

    function deleteMatch(obj) {
        const {value, error} = schemas.deleteMatch.validate(
            omit(obj, optionsKeys),
            {
                abortEarly: false,
            }
        );
        if (error)
            throw error;
        return value;
    }

    return {
        options,
        match,
        insert,
        update,
        deleteMatch,
        updateMatch,
    }
};

module.exports = {
    idSchema,
    optionsSchema,
    matchKeys,
    createValidators,
};
