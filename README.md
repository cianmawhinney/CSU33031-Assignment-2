# CSU33031 Assignment 2 - Flow Forwarding

A protocol to forward packets between applications on different networks, with forwarding being handled by separate forwarding applications.

# Key details
* Key premise is that applications want to communicate with each other using a network layer that isn't IPv4/6
* To do this, an application will pass traffic to a forwarding application
* New protocol uses TLV encoded strings to identify an application
* Each forwarder's routing table is dictated by a central controller that has a view of the entire network
* Forwarder's inform the controller of any changes, which is then able to propagate any changes to the entire network
* Forwarder application binds to UDP port 51510
* UDP is only being used for convenience, the idea is that the protocol could be implemented using Ethernet frames at a later date


# Project goals
## Part 1
* Basic, fixed topology
* Get a basic communication flow working
  * Call out to the controller to get the routing table
* First draft of the protocol

## Part 2
* Fully working controller
  * protocol/interface with forwarders nailed down
  * internal data structure for storing the state of the graph
  * implementation of algorithm for generating routes between every forwarder and registered application
* Support for applications registering themselves and de-registering
* Ideally by the end of this deadline the implementation of the solution will be completely finished

## Final Submission
* If possible, just work on the report


# Protocol
## Use cases
* Application registering with a forwarder
  * Port for data to be forwarded to
    * With the UDP implementation, this is can be worked out from the registration request packet, but the idea is to not be reliant on UDP features.
  * String identifier requested
* De-registration
  * Same as registration, but with a different message type?
* Some way to let the controller know of changes to the network
  * Should the forwarding service update its own table before telling the controller about a new application?
    * Nah, just let the controller deal with all routing table related things, then just push out the update to all nodes.
* Acknowledgements
* Forwarding packets with some kind of encapsulation
  * Forwarding message type
  * Source
  * Destination


## Header
* Message type (1 byte)
  * (0) Forwarded packet
  * Application registration
    * Sent to its local forwarder when an application wants to become visible on the network
  * Application de-registration
    * Sent to its local forwarder when an application wants to remove itself from the network
  * Forwarder registration
    * Outside the scope of the assignment
  * Forwarder de-registration
    * Outside the scope of the assignment
  * Routing table change
    * Sent by the controller
* Source/Destination
  * Encoded as TLV
    * Source is type 1
    * Destination is type 2
  * These are the words picked by each application to identify themselves

# Components
## Controller
* Needs to keep a copy of the state of the network at a minimum


## Application
* Print out any data it gets
* Generate a string and send it to another node

## Forwarder
* Drop any packets that it doesn't know where to route
