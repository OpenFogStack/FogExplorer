# FogExplorer

To start the application, just open index.html in your favorite browser.

## Assumptions

- Sensors and Sinks do not required any memory/performance and have a processing cost/time of 0
- There is only one connection per direction between two Machines
- Data Streams have no cycles
- Routing via a Machine does not lead to any cost/does not require any capacity
- Data just "flows" through the network, so each Module is stateless
- The bandwidth available between two Machines is used solely by the modelled application (no other third parties)
