'use strict';

const dgram = require('dgram');
const Protocol = require('flow-protocol');

const LISTENING_PORT = 51510;

const server = dgram.createSocket('udp4');
server.bind(LISTENING_PORT, () => {
  console.log('Controller up!');
});

const p = new Protocol(server);

const globalNetworkView = [
  // statically define routes
  {
    name: 'forwarder_1',
    ip_address: '',
    neighbours: [
      'forwarder_3',
      'forwarder_4',
    ],
    applications: [],
  },
  {
    name: 'forwarder_2',
    ip_address: '',
    neighbours: [
      'forwarder_7',
    ],
    applications: [],
  },
  {
    name: 'forwarder_3',
    ip_address: '',
    neighbours: [
      'forwarder_1',
      'forwarder_5',
      'forwarder_9',
    ],
    applications: [],
  },
  {
    name: 'forwarder_4',
    ip_address: '',
    neighbours: [
      'forwarder_1',
      'forwarder_3',
      'forwarder_5',
    ],
    applications: [],
  },
  {
    name: 'forwarder_5',
    ip_address: '',
    neighbours: [
      'forwarder_3',
      'forwarder_4',
      'forwarder_6',
      'forwarder_7',
      'forwarder_8',
    ],
    applications: [],
  },
  {
    name: 'forwarder_6',
    ip_address: '',
    neighbours: [
      'forwarder_5',
      'forwarder_7',
    ],
    applications: [],
  },
  {
    name: 'forwarder_7',
    ip_address: '',
    neighbours: [
      'forwarder_2',
      'forwarder_5',
      'forwarder_6',
      'forwarder_8',
    ],
    applications: [],
  },
  {
    name: 'forwarder_8',
    ip_address: '',
    neighbours: [
      'forwarder_5',
      'forwarder_7',
    ],
    applications: [],
  },
  {
    name: 'forwarder_9',
    ip_address: '',
    neighbours: [
      'forwarder_3',
    ],
    applications: [],
  },

];

p.on('forwarderRegistration', (packet, forwarderIP) => {
  // add forwarder to global network view
  // have the forwarder send a packet with its hostname
  // then add its ip address to the node with that name

  let forwarderName = packet.header.fields.find(field => {
    return field.type === Protocol.FIELD_TYPES.SOURCE;
  }).value.source;

  let forwarder = globalNetworkView.find(el => el.name === forwarderName);
  forwarder.ip_address = forwarderIP;

  globalNetworkView.forEach(forwarder => {
    if (forwarder.ip_address) {
      let table = calculateRoutesFromNode(globalNetworkView, forwarderName);
      server.send(
        p.encodePacket(p.buildRouteChangePacketObject(forwarderName, table)),
        LISTENING_PORT,
        forwarderIP,
      );
    }
  });
  // what happens now is the new routing table will be pushed out to all nodes
});

p.on('forwarderDeregistration', (packet) => {
  // remove the IP address from the global network view
  // push out a new routing table to all nodes

  // What should I do about the 'dangling' applications?
});

p.on('applicationRegistration', (packet, forwarderIP) => {
  // add the application name to the list of applications associated with the
  // router the request came from

  // console.log('Before: ', JSON.stringify(globalNetworkView, null, 2));
  // let forwarder = globalNetworkView.find(el => el.ip_address === forwarderIP)
  // forwarder.applications.push('lol');
  // console.log('After: ', JSON.stringify(globalNetworkView, null, 2));
});

p.on('applicationDeregistration', (packet) => {
  // pretty print the packet object
  console.log(JSON.stringify(packet, null, 2));
});

function calculateRoutesFromNode(graph, nodeName) {
  // calculate the next hops the node should send packets to for applications
  // TODO: Implement this
  return [];
}
