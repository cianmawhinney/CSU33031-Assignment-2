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
      ROUTE_CHANGE: 5
    }
  }

  /**
   *  Types associated with TLV encoded fields
   */
  static get FIELD_TYPES() {
    return {
      SOURCE: 1,
      DESTINATION: 2
    }
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
        }
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
        length: 'numTlvFields'
      });
    
    /**
     * @typedef {Buffer} Payload
     */
    this.payload = Parser.start()
      .buffer('payload', {
        clone: true,
        readUntil: 'eof'
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
      
      let msgType = "";
      switch (packet.header.messageType) {
        case Protocol.MESSAGE_TYPES.FORWARDED_PACKET:
          msgType = 'forwardedPacket';
          break;
        case Protocol.MESSAGE_TYPES.APPLICATION_REGISTRATION:
          msgType = 'applicationRegistration';
          break;
        case Protocol.MESSAGE_TYPES.APPLICATION_DEREGISTRATION:
          msgType = 'applicationDeregistration';
          break;
        case Protocol.MESSAGE_TYPES.FORWARDER_REGISTRATION:
          msgType = 'forwarderRegistration';
          break;
        case Protocol.MESSAGE_TYPES.FORWARDER_DEREGISTRATION:
          msgType = 'forwarderDeregistration';
          break;
        case Protocol.MESSAGE_TYPES.ROUTE_CHANGE:
          msgType = 'routeChange'
          break;
      }

      this.emit(msgType, packet);
    })
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
        fields: fields
      },
      payload: payload
    }
  }

  buildForwardedPacketObject(source, destination, payload) {
    let fields = [
      {
        type: Protocol.FIELD_TYPES.DESTINATION,
        value: {
          len: destination.length,
          destination: destination
        },
      },
      {
        type: Protocol.FIELD_TYPES.SOURCE,
        value: {
          len: source.length,
          source: source
        },
      },
    ];

    return this.buildPacketObject(
      Protocol.MESSAGE_TYPES.FORWARDED_PACKET,
      fields,
      payload
      );
  }
}

exports = module.exports = Protocol