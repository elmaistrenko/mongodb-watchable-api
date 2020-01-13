const crypto = require('crypto');
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
        isDeleted: {$ne: true},
    };
}

async function find({match: matchRaw, options}) {
    const {groupBy, page, perPage, sort, isOne} = options;
    if (groupBy)
        return await aggregate.apply(this, [[], {match: matchRaw, options}]);
    const match = transformId(matchRaw);
    if (isOne)
        return await this.findOne(match || {}, {
            ...sort ? {sort} : {},
            skip: (page - 1) * perPage,
            limit: 1,
        });
    let cursor = await this.find(match);
    const count = await cursor.count();
    if (sort)
        cursor = cursor.sort(sort);
    if (page && perPage)
        cursor = cursor.skip((page - 1) * perPage).limit(perPage);
    const data = await cursor.toArray();
    return {data, count};
}

async function aggregate(pipeline, {match: matchRaw, options}) {
    const {groupBy, page, perPage, sort, isOne} = options;
    const match = transformId(matchRaw);
    // TODO: Fix MongoError: FieldPath field names may not contain "." (groupBy)
    const cursor = await this.aggregate([
        {$match: match},
        ...pipeline,
        ...groupBy ? [{
            $group: {
                _id: Array.isArray(groupBy) ? groupBy.reduce((acc, cur) => {
                    acc[cur] = `$${cur}`;
                    return acc;
                }, {}) : `$${groupBy}`, items: {$push: '$$ROOT'}
            }
        }] : [],
        {
            $facet: {
                items: [
                    ...sort ? [{$sort: sort}] : [],
                    {$skip: (page - 1) * perPage}, {$limit: isOne ? 1 : perPage},
                ],
                count: [{$count: 'count'}],
            },
        }
    ]);
    const {items: data, count: [{count} = {count: 0}]} = await cursor.next();
    return isOne ? data[0] : {data, count};
}

async function insert({body}) {
    const date = new Date();

    function mapper(item) {
        return {
            ...item,
            createdAt: date,
            updatedAt: date,
        };
    }

    if (Array.isArray(body))
        return this.insertMany(body.map(mapper));
    return (await this.insertOne(mapper(body))).result;
}

async function update({body, match: matchRaw, options: {isOne}}) {
    const match = transformId(matchRaw);
    const u = {
        ...body,
        $currentDate: {
            updatedAt: true
        },
    };
    return (await this[isOne ? 'updateOne' : 'updateMany'](match, u)).result;
}

async function del({match: matchRaw, options: {isOne}}) {
    const match = transformId(matchRaw);
    return (await this[isOne ? 'updateOne' : 'updateMany'](match, {
        $set: {isDeleted: true},
        $currentDate: {deletedAt: true}
    })).result;
}

async function intervals({match: matchRaw}, keys) {
    const match = transformId(matchRaw);
    const key = (name, postfix) =>
        crypto.createHash('md5').update(name).digest("hex") + '_' + postfix;
    const fields = keys.reduce((acc, cur) => {
        acc[key(cur, 'min')] = {$min: `$${cur}`};
        acc[key(cur, 'max')] = {$max: `$${cur}`};
        return acc;
    }, {});
    const cursor = await this.aggregate([
        {$match: match},
        {$group: {_id: null, ...fields}}
    ]);
    const r = await cursor.next();
    return keys.reduce((acc, cur) => {
        if (r)
            acc[cur] = {min: r[key(cur, 'min')], max: r[key(cur, 'max')]};
        return acc;
    }, {});
}

async function distinct({match: matchRaw}, keys) {
    const match = transformId(matchRaw);
    const key = (name) =>
        crypto.createHash('md5').update(name).digest("hex");
    const group = {_id: null};
    const pipeline = keys.reduce((acc, cur) => {
        acc.push({$unwind: {path: '$' + cur}});
        group[key(cur)] = {$addToSet: `$${cur}`};
        return acc;
    }, []);
    const cursor = await this.aggregate([
        {$match: match},
        ...pipeline,
        {$group: group},
    ]);
    const r = (await cursor.toArray())[0];
    return keys.reduce((acc, cur) => {
        if (r)
            acc[cur] = r[key(cur)];
        return acc;
    }, {});
}

module.exports = {
    find,
    insert,
    update,
    del,
    intervals,
    distinct,
};
