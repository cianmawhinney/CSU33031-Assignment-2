'use strict';

const dgram = require('dgram');
const Protocol = require('flow-protocol');

const LISTENING_PORT = 51510;

const server = dgram.createSocket('udp4');
server.bind(LISTENING_PORT, () => {
  console.log('Controller up!');
});

const p = new Protocol(server);

p.on('applicationRegistration', (packet) => {
  console.log(packet);
});
