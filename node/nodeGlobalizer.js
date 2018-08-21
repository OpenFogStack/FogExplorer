// other libraries
vis = require("vis");
randomColor = require("randomcolor");

// infrastructure-model.js
const a = require("../sharedLogic/infrastructure-model");
InfrastructureModel = a.InfrastructureModel;
node_id = a.node_id;
node_label = a.node_label;
node_availableMemory = a.node_availableMemory;
node_usedMemory = a.node_usedMemory;
node_memoryPrice = a.node_memoryPrice;
node_performanceIndicator = a.node_performanceFactor;
connection_id = a.connection_id;
connection_from = a.connection_from;
connection_to = a.connection_to;
connection_bandwidthPrice = a.connection_bandwidthPrice;
connection_availableBandwidth = a.connection_availableBandwidth;
connection_usedBandwidth = a.connection_usedBandwidth;
connection_latency = a.connection_latency;

// data_flow-model.js
const b = require("../sharedLogic/data_flow-model");
DataFlowModel = b.DataFlowModel;
module_id = b.module_id;
module_label = b.module_label;
module_type = b.module_type;
module_mode = b.module_mode;
module_outputRate = b.module_outputRate;
module_outputRatio = b.module_outputRatio;
module_baseProcessingTime = b.module_processingTime;
module_requiredMemory = b.module_requiredMemory;
module_color = b.module_color;
module_notReachedBecauseOfDataPath = b.module_notReachedBecauseOfDataPath;
module_flowProcessingTime = b.module_flowProcessingTime;
module_processingCost = b.module_processingCost;
dataPath_id = b.dataPath_id;
dataPath_from = b.dataPath_from;
dataPath_to = b.dataPath_to;
dataPath_requiredBandwidth = b.dataPath_requiredBandwidth;
dataPath_involvedConnections = b.dataPath_involvedConnections;
dataPath_notReachedBecauseOfDataPath = b.dataPath_notReachedBecauseOfDataPath;
dataPath_transmissionTime = b.dataPath_transmissionTime;
dataPath_transmissionCost = b.dataPath_transmissionCost;

// evaluator.js
const e = require("../sharedLogic/evaluator");
loadModels = e.loadModels;
saveModelsAndFlowInformation = e.saveModelsAndFlowInformation;
setCurrentlySelectedModuleToModuleWithId = e.setCurrentlySelectedModuleToModuleWithId;
assignCurrentlySelectedModuleToNodeWithId = e.assignCurrentlySelectedModuleToNodeWithId;
calculateCoherentFlow = e.calculateCoherentFlow;
getProcessingTimeForModuleWithIdAsString = e.getProcessingTimeForModuleWithIdAsString;
getTotalProcessingTime = e.getTotalProcessingTime;
getTotalProcessingTimeAsString = e.getTotalProcessingTimeAsString;
getProcessingCostForModuleWithIdAsString = e.getProcessingCostForModuleWithIdAsString;
getTotalProcessingCost = e.getTotalProcessingCost;
getTotalProcessingCostAsString = e.getTotalProcessingCostAsString;
getTransmissionTimeForDataPathWithIdAsString = e.getTransmissionTimeForDataPathWithIdAsString;
getTotalTransmissionTime = e.getTotalTransmissionTime;
getTotalTransmissionTimeAsString = e.getTotalTransmissionTimeAsString;
getTransmissionCostForDataPathWithIdAsString = e.getTransmissionCostForDataPathWithIdAsString;
getTotalTransmissionCost = e.getTotalTransmissionCost;
getTotalTransmissionCostAsString = e.getTotalTransmissionCostAsString;
getFlowMetricsDataRepresentation = e.getFlowMetricsDataRepresentation;
round = e.round;
arrayContainsObject = e.arrayContainsObject;
getSetFieldname = e.getSetFieldname;
getSetFieldnameBaseProperties = e.getSetFieldnameBaseProperties;
getSetFieldnameFlowProperties = e.getSetFieldnameFlowProperties;

//dijkstra.js
const d = require("../sharedLogic/dijkstra");
dijkstra = d.dijkstra;
