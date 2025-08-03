const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const client = redis.createClient({
    url: 'redis://127.0.0.1:6379'
});

client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '1');
    return this;
}

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }))

    // See if we have a value for 'key' in redis
    const cacheValue = await client.hget(this.hashKey, key);


    // If we do, return that
    if (cacheValue) {
        const doc = JSON.parse(cacheValue);

        return Array.isArray(doc)
            ? doc.map(d => new this.model(d))
            : new this.model(doc);

    }

    // Otherwise, issue the query and store the result in redis
    const result = await exec.apply(this, arguments);

    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10 * 60); // Cache for 10 minutes
    return result;
};


module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
};