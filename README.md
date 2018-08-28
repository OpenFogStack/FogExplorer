# FogExplorer

To start the browser application, just open browser/index.html in your favorite browser.

To start the node application, just execute node/nodeServer.js with node.

To run all (node) test, just execute npm test.

Code naming notes (necessary because of incomplete refactoring):
- node = machine
- data path = data stream
- data flow = application

## Node compatibility

Ideally, we would use ECMA6 Modules, which would allow us to get rid fo the global variables because browser and node use the same paradigms. However, this seems unstable at the moment, so we stick with global variables... .

The current node compatibility is build on the following ideas:
* The shared logic classes get a module.exports statement for each function
* No other changes are made in these classes, they are build with the global availability of the browser in mind
* To use this code, the nodeGlobalizer.js takes all these exported functions and makes them globally available. By requiring this file, all node modules/methods can access everything.

## Assumptions

- Sensors and sinks do not required any memory/performance and have a processing cost/time of 0
- There is only one connection per direction between two nodes
- DataPaths have no cycles
- Routing does not lead to any cost/does not require any capacity
- Data just "flows" through the network, so each Module is stateless
- The bandwidth available between two nodes is used solely by the modelled application

## Decisions

- We store used bandwidth and memory so that it does not have to be recalculated every time for djikstra, they are stored in infrastructure because this is related to infrastructure
- We do not store metrics (time and cost) in fields, because to many factors influence these values
- If a resource is under-provisioned (memory/bandwidth), the available capacity is shared between its users (so each one gets less). This leads to a lower price, but an infinite processing/transmission time
- If a resource is under-provisioned (memory/bandwidth), the problem is treated in an isolated fashion, so it does not influence other resources (e.g. if a connection has not enough bandwidth, the next module still pretends to receive the amount that it would receive, if the connection had enough bandwidth). Reason: We want to identify problems independent from each other
- Multi Approach: If a data path does not work, all subsequent paths are treated as not possible. Information is only shown for paths, which are possible.
- Dijkstra only chooses connections for which the required bandwidth > the bandwidth of the currently evaluated initial module. However, for Dijkstra under-provisioning is not considered (because multiple executions would be needed)

### Multi S/A

- If a module has n outputs, the data is either send to all outputs (mode = individual), or **bandwidth/n** is send to all outputs (mode = total).
- If a model has n inputs, the module treats them as just one by using the sum of all bandwidths

## ToDos
- It is not possible to upload the same file twice, even if after the first upload the assignment changed

### Backlog ToDos
- Manipulation Possibilities: Add Node/Edge
- Real information for processing time should overwrite PU based estimate

### Better Code ToDos
- Change assignCurrentlySelectedModuleToNodeWithId(nodeId) to setAssignmentForModuleAndNodeId(moduleId, nodeId), the currentlySelectedModule field is browser dependent and should thus be stored in one of the browsers controllers, setCurrentlySelectedModuleToModuleWithId can be removed afterwards as well
- Move the infrastructure and dataflow helper methods in their own class, so that we do not need so many exports. Also move the evaluator code into its own evaluator class


