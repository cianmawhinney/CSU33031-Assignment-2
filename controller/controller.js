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
  // what happens now is the new routing table will be pushed out to all nodes

  let forwarderName = packet.header.fields.find(field => {
    return field.type === Protocol.FIELD_TYPES.SOURCE;
  }).value.source;

  let forwarder = globalNetworkView.find(el => el.name === forwarderName);
  forwarder.ip_address = forwarderIP;

  publishNewRouteTables(globalNetworkView);
});

p.on('forwarderDeregistration', (packet) => {
  // remove the IP address from the global network view
  // push out a new routing table to all nodes

  // What should I do about the 'dangling' applications?
});

p.on('applicationRegistration', (packet, forwarderIP) => {
  // add the application name to the list of applications associated with the
  // router the request came from

  let forwarder = globalNetworkView.find(el => el.ip_address === forwarderIP);
  let applicationName = packet.header.fields.find(field => {
    return field.type === Protocol.FIELD_TYPES.SOURCE;
  }).value.source;

  forwarder.applications.push(applicationName);
  publishNewRouteTables(globalNetworkView);
});

p.on('applicationDeregistration', (packet) => {
  // pretty print the packet object
  console.log(JSON.stringify(packet, null, 2));
});

function publishNewRouteTables(networkView) {
  // filter out any forwarders which haven't registered yet
  let validForwarders = networkView.filter(forwarder => forwarder.ip_address);

  validForwarders.forEach(forwarder => {
    let table = generateForwardingTable(networkView, forwarder.name);
    server.send(
      p.encodePacket(p.buildRouteChangePacketObject(forwarder.name, table)),
      LISTENING_PORT,
      forwarder.ip_address,
    );
  });
}

function generateForwardingTable(graph, sourceNodeName) {
  // calculate the next hops the node should send packets to for applications
  let table = [];
  let destinationNodes = graph.filter(forwarder => {
    return forwarder.applications.length > 0;
  });

  destinationNodes.forEach(destinationNode => {
    let nextHop = shortestPathNextHop(
      graph,
      sourceNodeName,
      destinationNode.name,
    );
    let isApplicationLocal = (sourceNodeName === destinationNode.name);

    destinationNode.applications.forEach(application => {
      let entry = {
        destinationString: application,
        local: isApplicationLocal,
        port: 3000,
        nextHop: nextHop,
      };
      table.push(entry);
    });
  });
  return table;
}

function shortestPathNextHop(graph, sourceName, destinationName) {
  let queue = [];
  let dist = {};
  let prev = {};

  graph.forEach(v => {
    dist[v.name] = Infinity;
    prev[v.name] = undefined;
    queue.push(v.name);
  });

  dist[sourceName] = 0;

  while (queue.length !== 0) {
    let u = findMinKeyFromQueue(queue, dist);
    // if (u === destinationName) {
    //   break;
    // }
    queue = queue.filter(item => item !== u); // remove u from queue

    let uNode = graph.find(node => node.name === u);

    uNode.neighbours.forEach(v => {
      // assuming the weight of each edge is 1
      let alt = dist[u] + 1;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    });
  }

  // walk back through the path to find the next hop
  let nextHop = '';
  let x = destinationName;
  while (x !== sourceName) {
    nextHop = x;
    x = prev[x];
  }
  return nextHop;
}

function findMinKeyFromQueue(q, obj) {
  let keys = [...q];
  let minKey = keys.shift();
  let minVal = obj[minKey];
  keys.forEach(key => {
    if (obj[key] < minVal) {
      minKey = key;
      minVal = obj[key];
    }
  });
  return minKey;
}
