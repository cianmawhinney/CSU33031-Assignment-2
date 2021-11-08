const dgram = require('dgram');
const Protocol = require('flow-protocol');

const p = new Protocol();

// message type, arg length, source id, source id length, 'AA'
let b = Buffer.from([0x01, 0x01, 0x01, 0x02, 0x41, 0x41]);
let parsed = p.parse(b);
console.log(JSON.stringify(parsed));
let bNew = p.encode(parsed);
console.log(bNew);

console.log("Hi, I'm the forwarder, I will be figuring out where to send data given to me");

// wait for 10 seconds so that the program doesn't exit immediately
setTimeout(() => {}, 10000);
