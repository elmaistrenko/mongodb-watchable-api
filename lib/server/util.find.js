const db = require('./util.db');

module.exports = async function (query, intervalKeys, distinctKeys) {
    const {options: {meta}} = query;
    const data = await db.find.apply(this, [query]);
    if (meta) {
        const [
            intervals,
            intervalsByQuery,
            distinctValues,
            distinctValuesByQuery,
        ] = await Promise.all([
            db.intervals.apply(this, [{}, intervalKeys]),
            db.intervals.apply(this, [query, intervalKeys]),
            db.distinct.apply(this, [{}, distinctKeys]),
            db.distinct.apply(this, [query, distinctKeys]),
        ]);
        return {
            ...data,
            intervals,
            intervalsByQuery,
            distinctValues,
            distinctValuesByQuery,
        };
    }
    return data;
};
