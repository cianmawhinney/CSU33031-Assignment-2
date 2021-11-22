'use strict';

const dgram = require('dgram');
const Protocol = require('flow-protocol');

const APPLICATION_PORT = 3000;
const FORWARDER_PORT = 51510;
const dataDestination = process.env.DESTINATION;
const dataSource = process.env.HOSTNAME;

const client = dgram.createSocket('udp4');

const p = new Protocol(client);

client.bind(APPLICATION_PORT, () => {
  console.log('Application up!');

  // announce the application to the network
  let packet = p.encodePacket(
    p.buildApplicationRegistrationPacketObject(dataSource, APPLICATION_PORT),
  );
  client.send(packet, FORWARDER_PORT, 'localhost');

  // wait a random amount of time to make log output easier to follow
  setTimeout(() => {
    setInterval(sendRandomInteger, 5 * 1000);
  }, Math.floor(Math.random() * 2000));
});

p.on('forwardedPacket', (packet) => {
  console.log('Received', packet.payload);
});

function sendRandomInteger() {
  let payload = Buffer.alloc(4);
  payload.writeUInt32BE(Math.floor(Math.random() * 100000));
  const obj = p.buildForwardedPacketObject(
    dataSource,
    dataDestination,
    payload,
  );
  const packet = p.encodePacket(obj);
  client.send(packet, FORWARDER_PORT, 'localhost');
  console.log('Sending', payload);
}
