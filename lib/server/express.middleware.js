const {createValidators} = require('../model.request');

module.exports = (getSchemas) => async function (req, res, next) {
    try {
        const schemas = await getSchemas(req.user);
        const validators = createValidators(schemas);
        const query = {...req.query, ...req.params};
        if (req.params._id)
            query.isOne = true;
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
                    body: validators.update(req.body),
                    match: validators.updateMatch(query),
                };
                break;
            case 'DELETE':
                req.apiQuery = {
                    options,
                    match: validators.deleteMatch(query),
                };
                break;
            case 'POST':
                req.apiQuery = {
                    options,
                    body: validators.insert(req.body),
                };
                break;
        }
        next();
    } catch (e) {
        next(e);
    }
};
