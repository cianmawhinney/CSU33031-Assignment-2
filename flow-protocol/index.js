'use strict';

const Parser = require('binary-parser-encoder').Parser;
const EventEmitter = require('events');

class Protocol extends EventEmitter {

  /**
   * Lookup table for the message type field that encodes the event
   */
  static get MESSAGE_TYPES() {
    return {
      FORWARDED_PACKET: 0,
      APPLICATION_REGISTRATION: 1,
      APPLICATION_DEREGISTRATION: 2,
      FORWARDER_REGISTRATION: 3,
      FORWARDER_DEREGISTRATION: 4,
      ROUTE_CHANGE: 5,
    };
  }

  /**
   *  Types associated with TLV encoded fields
   */
  static get FIELD_TYPES() {
    return {
      SOURCE: 1,
      DESTINATION: 2,
      APPLICATION_PORT: 3,
    };
  }

  constructor(connection) {
    super();

    // For documentation see: https://github.com/Ericbla/binary-parser
    /**
     * A field contained within the packet
     * @typedef {Object} TLVField
     * @property {Number} messageType
     * @property {Number} numTlvFields
     * @property {TLVField[]} fields
     */
    this.tlvField = Parser.start()
      .uint8('type')
      .choice('value', {
        tag: 'type',
        choices: {
          1: Parser.start().uint8('len').string('source', {length: 'len'}),
          2: Parser.start().uint8('len').string('destination', {length: 'len'}),
          3: Parser.start().uint8('len').uint16('port'),
        },
      });

    /**
     * A packet decomposed from binary form into an object
     * @typedef {Object} Header
     * @property {Number} messageType
     * @property {Number} numTlvFields
     * @property {TLVField[]} fields
     */
    this.header = Parser.start()
      .uint8('messageType')
      .uint8('numTlvFields')
      .array('fields', {
        type: this.tlvField,
        length: 'numTlvFields',
      });

    /**
     * @typedef {Buffer} Payload
     */
    this.payload = Parser.start()
      .buffer('payload', {
        clone: true,
        readUntil: 'eof',
      });

    /**
     * @typedef {Object} Packet
     * @property {Header} header
     * @property {Payload} payload
     */
    this.packet = Parser.start()
      .nest('header', {type: this.header})
      .nest({type: this.payload});

    connection.on('message', (msg, rinfo) => {
      let packet = this.decodePacket(msg);

      switch (packet.header.messageType) {
        case Protocol.MESSAGE_TYPES.FORWARDED_PACKET:
          this.emit('forwardedPacket', packet);
          break;
        case Protocol.MESSAGE_TYPES.APPLICATION_REGISTRATION:
          this.emit('applicationRegistration', packet, rinfo.address);
          break;
        case Protocol.MESSAGE_TYPES.APPLICATION_DEREGISTRATION:
          this.emit('applicationDeregistration', packet, rinfo.address);
          break;
        case Protocol.MESSAGE_TYPES.FORWARDER_REGISTRATION:
          this.emit('forwarderRegistration', packet, rinfo.address);
          break;
        case Protocol.MESSAGE_TYPES.FORWARDER_DEREGISTRATION:
          this.emit('forwarderDeregistration', packet, rinfo.address);
          break;
        case Protocol.MESSAGE_TYPES.ROUTE_CHANGE:
          this.emit('routeChange', packet);
          break;
      }
    });
  }


  encodePacket(object) {
    return this.packet.encode(object);
  }

  decodePacket(buf) {
    return this.packet.parse(buf);
  }

  /*
  TODO: convert this to a JSDoc string
  {
    "header": {
      "messageType": 0,
      "numTlvFields": 1,
      "fields": [
        {
          "type": 1,
          "value": {
            "len": 2,
            "source": "AA"
          }
        }
      ]
    },
    "body": "Buffer"
  }
  */
  buildPacketObject(messageType, fields, payload) {
    return {
      header: {
        messageType: messageType,
        numTlvFields: fields.length,
        fields: fields,
      },
      payload: payload,
    };
  }

  buildForwardedPacketObject(source, destination, payload) {
    let fields = [
      {
        type: Protocol.FIELD_TYPES.DESTINATION,
        value: {
          len: destination.length,
          destination: destination,
        },
      },
      {
        type: Protocol.FIELD_TYPES.SOURCE,
        value: {
          len: source.length,
          source: source,
        },
      },
    ];

    return this.buildPacketObject(
      Protocol.MESSAGE_TYPES.FORWARDED_PACKET,
      fields,
      payload,
    );
  }

  buildApplicationRegistrationPacketObject(source, port) {
    let fields = [
      {
        type: Protocol.FIELD_TYPES.SOURCE,
        value: {
          len: source.length,
          source: source,
        },
      },
      {
        type: Protocol.FIELD_TYPES.APPLICATION_PORT,
        value: {
          len: 2, // not needed, but better to specify a 16 bit (2 byte) value
          port: port,
        },
      },
    ];

    const emptyPayload = Buffer.alloc(0);

    return this.buildPacketObject(
      Protocol.MESSAGE_TYPES.APPLICATION_REGISTRATION,
      fields,
      emptyPayload,
    );
  }

  buildForwarderRegistrationPacketObject(source) {
    let fields = [
      {
        type: Protocol.FIELD_TYPES.SOURCE,
        value: {
          len: source.length,
          source: source,
        },
      },
    ];

    const emptyPayload = Buffer.alloc(0);

    return this.buildPacketObject(
      Protocol.MESSAGE_TYPES.FORWARDER_REGISTRATION,
      fields,
      emptyPayload,
    );
  }

  buildRouteChangePacketObject(destination, routeTable) {
    let fields = [
      {
        type: Protocol.FIELD_TYPES.DESTINATION,
        value: {
          len: destination.length,
          destination: destination,
        },
      },
    ];

    const payload = Buffer.from(JSON.stringify(routeTable));

    return this.buildPacketObject(
      Protocol.MESSAGE_TYPES.ROUTE_CHANGE,
      fields,
      payload,
    );
  }
}

exports = module.exports = Protocol;
