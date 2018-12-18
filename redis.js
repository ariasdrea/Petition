const redis = require("redis");
const client = redis.createClient({
    host: "localhost",
    port: 6379
});

const { promisify } = require("util");

// there would be an error if redis is down
client.on("error", function(err) {
    console.log(err);
});
exports.get = promisify(client.get).bind(client);

exports.setex = promisify(client.setex).bind(client);

exports.del = promisify(client.del).bind(client);
