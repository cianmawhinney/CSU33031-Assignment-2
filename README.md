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

# Running
1. Ensure docker installed on your machine
2. Clone this repository
   ``` bash
   $ git clone https://github.com/cianmawhinney/CSU33031-Assignment-2.git
   ```
3. Navigate into the project folder
   ``` bash
   $ cd CSU33031-Assignment-2
   ```
4. Start the docker compose setup
   ``` bash
   $ docker compose up
   ```

# Project goals
## Part 1
- [x] Basic, fixed topology
- [x] Get a basic communication flow working
- [x] First draft of the protocol

## Part 2
- [x] Fully working controller
  - [x] Protocol finalised
  - [x] Creation of an internal data structure for storing the state of the network
  - [x] Implementation of algorithm for generating routes between every forwarder and registered application
- [x] Support for applications registering themselves and de-registering
- [x] Completely finish implementation of project

## Final Submission
- [x] Submission of report and all source files


# Protocol
## Use cases
* Application registering with a forwarder
  * Port for data to be forwarded to
    * With the UDP implementation, this is can be worked out from the registration request packet, but the idea is to not be reliant on UDP features.
  * String identifier requested
* De-registration
  * Same idea as registration, but with a different message type
* Some way to let the controller know of changes to the network
  * Controller should be told about any changes to the network, then will send out updated routing tables to all nodes
* Acknowledgements
  * Not implemented in this assignment
* Forwarding packets with some kind of encapsulation
  * Forwarding message type
  * Source
  * Destination


## Header
* Message type (1 byte)
  * (0) Forwarded packet
  * (1) Application registration
    * Sent to its local forwarder when an application wants to become visible on the network
  * (2) Application de-registration
    * Sent to its local forwarder when an application wants to remove itself from the network
  * (3) Forwarder registration
    * Sent to the controller when the forwarder comes online
    * Also transmitted are a list of other forwarders that it's connected directly to
      * Not necessary to implement for this assignment
  * (4) Forwarder de-registration
    * Sent to the controller when the forwarder removes itself from the network
    * Any routes it's involved in will be removed from the controller
      * Not necessary to implement for this assignment
  * (5) Routing table change
    * Sent by the controller
* Number of TLV encoded fields (1 byte)
* Source/Destination
  * Encoded as TLV
    * Source is type 1
    * Destination is type 2
    * Application port is type 3
  * These are the words picked by each application to identify themselves
