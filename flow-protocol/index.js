const Parser = require('binary-parser-encoder').Parser;

class Protocol {

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

  // Types associated with TLV encoded fields
  static get FIELD_TYPES() {
    return {
      SOURCE: 1,
      DESTINATION: 2
    }
  }

  constructor() {

    this.tlvField = Parser.start()
      .uint8('type')
      .choice('value', {
        tag: 'type',
        choices: {
          1: Parser.start().uint8('len').string('source', {length: 'len'}),
          2: Parser.start().uint8('len').string('destination', {length: 'len'}),
        }
      })

    this.header = new Parser()
      .uint8('messageType')
      .uint8('numTlvFields')
      .array('fields', {
        type: this.tlvField,
        length: 'numTlvFields'
      })
  }

  parse(buffer) {
    return this.header.parse(buffer);
  }

  encode(obj) {
    return this.header.encode(obj);
  }
}

exports = module.exports = Protocol