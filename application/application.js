const dgram = require('dgram');

const dataDestination = process.env.DESTINATION;
console.log(`Hi, I'm the application, I will be generating data to send to ${dataDestination}`);
