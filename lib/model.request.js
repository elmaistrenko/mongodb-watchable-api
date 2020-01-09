const Joi = require('@hapi/joi');
const {omit} = require('lodash');

const id = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const optionsSchema = Joi.object({
    isOne: Joi.boolean().default(false),
    page: Joi.number().greater(0).default(1),
    perPage: Joi.number().greater(0).less(100).default(100),
    sort: Joi.object().pattern(/^[\w\d_]+$/, Joi.number().valid(-1, 1)).default({createdAt: -1}),
    groupBy: Joi.array().min(1).items(Joi.string().pattern(/^[\w\d_]+$/)),
});

const matchKeys = {
    _id: Joi.alternatives().try(id, Joi.object({
        $in: Joi.array().items(id),
    })),
    isDeleted: Joi.any().forbidden(),
};

const createValidator = (documentSchema = Joi.object(), documentOptions = {}, matchSchema = Joi.object()) =>
    function validate(obj, validateOptions = true, validateMatch = true, validateDocument = true) {
        let options, match, document;
        if (validateOptions) {
            const {value, error} = optionsSchema.validate(obj, {
                abortEarly: false,
                allowUnknown: true,
                stripUnknown: true,
            });
            if (error)
                throw error;
            options = value;
        }
        if (validateMatch) {
            const {value, error} = matchSchema.keys(matchKeys).default({}).validate(
                omit(obj, Object.keys(optionsSchema.describe().keys).concat(['document'])),
                {
                    abortEarly: false,
                }
            );
            if (error)
                throw error;
            value.isDeleted = {$ne: true};
            match = value;
        }

        if (validateDocument) {
            const {value, error} = documentSchema.keys({
                _id: Joi.any().forbidden(),
                isDeleted: Joi.any().forbidden(),
                createdAt: Joi.any().forbidden(),
                updatedAt: Joi.any().forbidden(),
            }).required().min(1).validate(
                obj.document || obj,
                {
                    abortEarly: false,
                    ...documentOptions,
                }
            );
            if (error)
                throw error;
            document = value;
        }

        return {
            match,
            options,
            document,
        };
    };


module.exports = {
    optionsSchema,
    createValidator,
};
