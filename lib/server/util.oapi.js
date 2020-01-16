const Joi = require('@hapi/joi');
const {optionsSchema, idSchema} = require('../model.request');
const {joi2params, joi2oapi, errors} = require('re-authorization/lib/server/util.openapi');

const idParam = {
    name: '_id',
    in: 'path',
    schema: joi2oapi(idSchema),
    required: true,
};

function findById(pathname, name, security) {
    return {
        tags: [name],
        summary: `${pathname}/{_id}`,
        description: `Find single ${name}`,
        security,
        parameters: [idParam],
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            $ref: `#/components/schemas/${name}`,
                        },
                    },
                },
            },
            ...errors(security, true),
        },
    };
}

function find(pathname, name, schemas, security) {
    const {match} = schemas;
    return {
        tags: [name],
        summary: pathname,
        description: `Find ${name}`,
        security,
        parameters: [
            ...joi2params(optionsSchema, 'query', ['meta', 'isOne', 'page', 'perPage', 'sort', 'groupBy']),
            ...joi2params(match, 'query'),
        ],
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            oneOf: [
                                {$ref: `#/components/schemas/${name}`},
                                {
                                    type: 'object',
                                    properties: {
                                        count: {
                                            type: 'integer',
                                        },
                                        items: {
                                            type: 'array',
                                            items: {$ref: `#/components/schemas/${name}`},
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
            },
            ...errors(security),
        },
    };
}

function post(pathname, name, schemas, security) {
    const documentSchema = schemas.document();
    return {
        tags: [name],
        summary: pathname,
        description: `Add a ${name}`,
        security,
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: joi2oapi(Joi.alternatives().try(
                        documentSchema,
                        Joi.array().items(documentSchema).required().min(1)
                    )),
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                        }
                    }
                },
            },
            ...errors(security),
        },
    };
}

function patchById(pathname, name, schemas, security) {
    return {
        tags: [name],
        summary: `${pathname}/{_id}`,
        description: `Update single ${name}`,
        security,
        parameters: [idParam],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: joi2oapi(schemas.update),
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                        },
                    },
                },
            },
            ...errors(security),
        }
    };
}

function patch(pathname, name, schemas, security) {
    return {
        tags: [name],
        summary: pathname,
        description: `Update single or many ${name}`,
        security,
        parameters: [
            ...joi2params(optionsSchema, 'query', ['isOne']),
            ...joi2params(schemas.updateMatch, 'query'),
        ],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: joi2oapi(schemas.update),
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object'
                        }
                    }
                },
            },
            ...errors(security),
        },
    };
}

function delById(pathname, name, schemas, security) {
    return {
        tags: [name],
        summary: `${pathname}/{_id}`,
        description: `Delete single ${name}`,
        security,
        parameters: [idParam],
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                        },
                    },
                },
            },
            ...errors(security),
        }
    };
}

function del(pathname, name, schemas, security) {
    return {
        tags: [name],
        summary: pathname,
        description: `Delete single or many of ${name}`,
        security,
        parameters: [
            ...joi2params(optionsSchema, 'query', ['isOne']),
            ...joi2params(schemas.deleteMatch, 'query'),
        ],
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object'
                        }
                    }
                },
            },
            ...errors(security),
        },
    };
}

function distinct(pathname, name, schemas, security) {
    return {
        tags: [name],
        summary: `${pathname}/distinct`,
        security,
        parameters: [
            ...joi2params(optionsSchema, 'query', ['distinctKey']),
            ...joi2params(schemas.match, 'query'),
        ],
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                        },
                    },
                },
            },
            ...errors(security),
        },
    };
}

module.exports = {
    find,
    findById,
    patchById,
    patch,
    del,
    delById,
    post,
    distinct,
};
