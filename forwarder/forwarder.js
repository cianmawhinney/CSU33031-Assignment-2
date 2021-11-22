'use strict';

const { assert } = require('console');
const dgram = require('dgram');
const Protocol = require('flow-protocol');

const LISTENING_PORT = 51510;
const controllerHost = 'controller';

const server = dgram.createSocket('udp4');
server.bind(LISTENING_PORT);

const routingTableFile = process.env.ROUTING_TABLE_FILE;
assert(typeof routingTableFile === 'string');

/**
 * The routing table for the forwarder
 * @constant {Object[]} routingTable
 * @constant {String}   routingTable[].destinationString
 * @constant {Boolean}  routingTable[].local
 * @constant {Number}   routingTable[].port
 * @constant {String}   routingTable[].nextHop
 */
const routingTable = require(routingTableFile);
const p = new Protocol(server);


/**
 * @param {Packet} packet
 */
p.on('forwardedPacket', (packet) => {
  let dest = packet.header.fields.find(field => {
    return field.type === Protocol.FIELD_TYPES.DESTINATION;
  }).value.destination; // TODO: Refactor packet into its own class

  let tableEntry = routingTable.find(entry => entry.destinationString === dest);


  if (tableEntry !== undefined) {
    if (tableEntry.local) {
      // application local to forwarder
      // so send the payload to localhost:${tableEntry.port}
      server.send(p.encodePacket(packet), tableEntry.port, 'localhost');
    } else {
      // application on remote forwarder
      // so send payload to ${tableEntry.nextHop}:LISTENING_PORT
      server.send(p.encodePacket(packet), LISTENING_PORT, tableEntry.nextHop);
    }
  }
  // drop packet if destination not found in routing table
});

p.on('applicationRegistration', (packet) => {
  // just pass the packet on to the controller
  server.send(p.encodePacket(packet), LISTENING_PORT, controllerHost);
});

p.on('applicationDeregistration', (packet) => {
  // just pass the packet on to the controller
  server.send(p.encodePacket(packet), LISTENING_PORT, controllerHost);
});
