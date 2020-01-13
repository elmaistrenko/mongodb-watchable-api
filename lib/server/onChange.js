module.exports = (dbName, collName, chan) => change => {
    const {ns: {db, coll}} = change;
    if (db === dbName && coll === collName) {
        chan.put(change);
    }
};
