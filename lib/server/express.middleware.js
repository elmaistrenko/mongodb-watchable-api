const {createValidators} = require('../model.request');

module.exports = (getSchemas) => async function (req, res, next) {
    try {
        const schemas = await getSchemas(req.user);
        const validators = createValidators(schemas);
        const query = {...req.query, ...req.params};
        const options = validators.options(query);
        switch (req.method) {
            case 'GET':
                req.apiQuery = {
                    options,
                    match: validators.match(query),
                };
                break;
            case 'PATCH':
                req.apiQuery = {
                    options,
                    update: validators.update(req.body),
                    match: validators.match(query),
                };
                break;
            case 'DELETE':
                req.apiQuery = {
                    options,
                    del: validators.del(query),
                };
                break;
            case 'POST':
                req.apiQuery = {
                    options,
                    insert: validators.insert(req.body),
                };
                break;
        }
        if (req.params._id) {
            req.apiQuery.options.isOne = true;
        }
        next();
    } catch (e) {
        next(e);
    }
};
