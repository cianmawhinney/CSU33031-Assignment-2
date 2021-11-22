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
  // pretty print the packet object
  console.log(JSON.stringify(packet, null, 2));
});

p.on('applicationDeregistration', (packet) => {
  // pretty print the packet object
  console.log(JSON.stringify(packet, null, 2));
});
