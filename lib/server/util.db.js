const {ObjectID} = require('mongodb');
const {isString} = require('lodash');

function transformId(match) {
    const {_id} = match || {};
    return {
        ...match,
        ..._id ? {
            _id: isString(_id) ? new ObjectID(_id) : {
                $in: _id.$in.map(_id => new ObjectID(_id)),
            },
        } : {},
        $or: [{isDeleted: false}, {isDeleted: {$exists: false}}],
    };
}

async function get({match: matchRaw, options}) {
    const {groupBy, page, perPage, sort, isOne} = options;
    const match = transformId(matchRaw);
    if (groupBy) {
        const pipeline = [
            {$match: match},
            {$group: {_id: groupBy, items: {$push: '$$ROOT'}}},
            {
                $facet: {
                    items: [
                        ...sort ? [{$sort: sort}] : [],
                        ...page && perPage ? [{$skip: (page - 1) * perPage}, {$limit: isOne ? 1: perPage}] : [],
                    ],
                    count: [{$count: 'count'}],
                },
            }
        ];
        return await aggregate.apply(this, [pipeline]);
    }
}

async function aggregate(pipeline) {

}
