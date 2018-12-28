const { Server } = require('http');
const { Bridge } = require('./now__bridge.js');
const page = require('./page.js');

const bridge = new Bridge();
bridge.port = 3000;

process.env.NODE_ENV = 'production';

const server = new Server(page.default);
server.listen(bridge.port);

exports.launcher = bridge.launcher;
