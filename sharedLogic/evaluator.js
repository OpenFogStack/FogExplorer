// models
let infrastructureModel;
let dataFlowModel;

function loadModels(json) {
  // first initialize models
  infrastructureModel = new InfrastructureModel(json);
  infrastructureModel.resetAndInitialize();

  dataFlowModel = new DataFlowModel(json);
  dataFlowModel.resetAndInitialize();

  // it is possible that nodes are already assigned and coherent flow already exists
  recalculateUsedMemoryOnAllNodes();
  calculateCoherentFlow();

  return true;
}

function getAllDataRepresentation() {
  const data = {};
  data["nodes"] = infrastructureModel.getNodesDataRepresentation();
  data["connections"] = infrastructureModel.getConnectionsDataRepresentation();
  data["modules"] = dataFlowModel.getModulesDataRepresentation();
  data["dataPaths"] = dataFlowModel.getDataPathsDataRepresentation();
  data["placements"] = dataFlowModel.nodeToModuleAssignments;
  data["flowMetrics"] = getFlowMetricsDataRepresentation();
  return JSON.stringify(data, null, 2);
}

function setCurrentlySelectedModuleToModuleWithId(moduleID) {
  dataFlowModel.currentlySelectedModuleId = moduleID;
}

function recalculateUsedMemoryOnAllNodes() {
  infrastructureModel.nodes.forEach(function(node) {
    const moduleIds = dataFlowModel.getIdsOfModulesAssignedToNodeWithId(node_id(node));

    if (moduleIds !== undefined) {
      moduleIds.forEach(function(moduleId) {
        const requiredMemory = module_requiredMemory(dataFlowModel.modules.get(moduleId));
        infrastructureModel.addUsedMemoryToNodeWithId(node_id(node), requiredMemory);
      });
    }
  });
}

/**
 * Assigns the currently selected module to the node with the given id. If it was assigned to this node before, it just gets removed.
 *
 * @param nodeId - the id of the node
 * @return {string} - the id of the node the module was last assigned to, if any
 */
function assignCurrentlySelectedModuleToNodeWithId(nodeId) {
  const currentlySelectedModuleId = dataFlowModel.currentlySelectedModuleId;

  if (currentlySelectedModuleId !== null) {

    const requiredMemory = module_requiredMemory(dataFlowModel.modules.get(currentlySelectedModuleId));

    // gets the object, so changes sync!
    const nodeToModuleAssignments = dataFlowModel.nodeToModuleAssignments;
    const lastAssignedNodeId = dataFlowModel.nodeToModuleAssignments[currentlySelectedModuleId];

    // update assignment field of dataFlowModel and usedMemory of nodes
    if (lastAssignedNodeId !== nodeId) {
      // replace assignment with clicked node, if the clicked node is not the one from before
      nodeToModuleAssignments[currentlySelectedModuleId] = nodeId;

      // add used memory
      infrastructureModel.addUsedMemoryToNodeWithId(nodeId, requiredMemory);
    } else {
      // we clicked the same node again, so no need to re-assign
      delete nodeToModuleAssignments[currentlySelectedModuleId];
    }

    if (lastAssignedNodeId !== undefined) {
      // remove used memory from last node
      infrastructureModel.removeUsedMemoryFromNodeWithId(lastAssignedNodeId, requiredMemory);

    }

    return lastAssignedNodeId;
  }

}

/**
 * Calculates the coherent flow of data paths on the infrastructure. The result can be incomplete, if no coherent flow
 * exists. A new flow is only calculated, if all modules are assigned.
 *
 * When executed, clears and sets the flow related fields from the data flow model and the infrastructure model.
 * 
 * Exception: the used memory for nodes, because this is determined by node to module assignments.

 * If a coherent flow from all sensors to sinks exist, the dataFlowModel.coherentFlowFound is set to true, otherwise
 * the value will be false after the function returns.
 *
 */
function calculateCoherentFlow() {
  // clear prior flow information
  dataFlowModel.resetCalculatedFlowInformation();
  infrastructureModel.resetCalculatedFlowInformation();

  // only re-calculate when all modules assigned
  if (dataFlowModel.checkAllModulesAssigned() === false) {
    //console.log("Not all Modules are assigned yet, so not re-calculating.");
    return false;
  }

  //console.log("All Modules are assigned, re-calculating coherent flow.");

  const dataPaths = dataFlowModel.dataPaths.get();
  const impossiblePaths = [];

  for (let i = 0; i < dataPaths.length; i++) {
    const dataPath = dataPaths[i];
    const initialNodeId = dataFlowModel.nodeToModuleAssignments[dataPath_from(dataPath)];
    const finalNodeId = dataFlowModel.nodeToModuleAssignments[dataPath_to(dataPath)];

    if (initialNodeId === finalNodeId) {
      //console.log("We don't need to calculate, because we stay on the same node");
    } else {
      // let's get the dijkstra problem (-> considering the dataPath's required bandwidth)
      const problem = infrastructureModel
        .getDijkstraProblemForInfrastructure(dataPath_requiredBandwidth(dataPath));

      const dijkstraResult = dijkstra(problem, initialNodeId, finalNodeId);

      // DATA PATH IS NOT POSSIBLE
      if (dijkstraResult.dijkstraCost === "Infinity") {
        impossiblePaths.push(dataPath);
      }

      // THERE IS A PATH TO ANOTHER NODE
      //console.log("Path involves these nodes: " + dijkstraResult.path);

      // there is possibly no direct connection between lastNodeId and nextNodeId, that's why we do this
      // --> in this case we need to go via another node
      let n1 = undefined;
      let n2 = undefined;
      const idsOfInvolvedConnections = [];

      dijkstraResult.path.forEach(function(nodeId) {
        n2 = nodeId;

        if (n1 !== undefined && n2 !== undefined) {
          const connectionId = infrastructureModel.getConnectionIdBetweenNodes(n1, n2);
          // Taking a path requires bandwidth
          infrastructureModel.addUsedBandwidthToConnectionWithId(connectionId,
            dataPath_requiredBandwidth(dataPath));
          idsOfInvolvedConnections.push(connectionId);
        }

        n1 = n2;
      });

      // Let's save the path
      dataFlowModel.addFlowInformationToDataPath({
        dataPathId: dataPath_id(dataPath),
        involvedConnectionIds: idsOfInvolvedConnections
      });
    }
  }

  if (impossiblePaths.length === 0) {
    dataFlowModel.coherentFlowFound = true;
    //console.log("A coherent flow was found!");
  } else {
    // We calculated all paths and set the information. Now we have to clean up if a prior path was broken
    dataFlowModel.coherentFlowFound = false;
    //console.log("No coherent flow exists");

    impossiblePaths.forEach(function(impPath) {
      _clearSubsequentDataPathsRecursively(impPath, dataPath_id(impPath));
    });

  }

  // set the impossible paths
  dataFlowModel.impossiblePaths = impossiblePaths;

  // final step: let's calculate some more flow properties
  dataFlowModel.modules.forEach(function(module) {
    _calculateProcessingTimeForModuleWithId(module_id(module));
    _calculateProcessingCostForModuleWithId(module_id(module));
  });

  dataFlowModel.dataPaths.forEach(function(dataPath) {
    _calculateTransmissionTimeForDataPathWithId(dataPath_id(dataPath));
    _calculateTransmissionCostForDataPathWithId(dataPath_id(dataPath));
  });

  return dataFlowModel.coherentFlowFound;

}

function _clearSubsequentDataPathsRecursively(impPath, originalImpossiblePathId) {
  //console.log("Path " + originalImpossiblePathId + " prevents " + dataPath_id(impPath) + " from being reached");



  dataFlowModel.setDataPathWithIdToNotReached(dataPath_id(impPath), originalImpossiblePathId);
  // get the target module id
  const targetModuleId = dataPath_to(impPath);
  dataFlowModel.setModuleWithIdToNotReached(targetModuleId, originalImpossiblePathId);

  // get all subsequent data paths
  const subsequentDataPaths = [];
  dataFlowModel.dataPaths.forEach(function(path) {
    if (dataPath_from(path) === targetModuleId) {
      subsequentDataPaths.push(path);
    }
  });

  // recursive call
  subsequentDataPaths.forEach(function(subPath) {
    _clearSubsequentDataPathsRecursively(subPath, originalImpossiblePathId);
  });
}

/* *****************************************************************
 Processing Time and Cost
***************************************************************** */

/**
 *
 * Calculates and sets the actual processing time for the module with the given id.
 * The actual processing time depends on the following factors:
 *  1. the given processing time of the module
 *  2. the host node's performance factor
 *  3. if the host node has not enough memory (in which case the processing time equals ∞)
 *
 *  A sensor/sink has always a processing time of 0.
 *
 * @param moduleId - the id of the module
 * @return {*} - the processing time, can be "∞", null if module is not reached
 * */
function _calculateProcessingTimeForModuleWithId(moduleId) {
  const module = dataFlowModel.modules.get(moduleId);

  if (dataFlowModel.checkModuleWithIdIsReached(moduleId) === false) {
    module_flowProcessingTime(module, null);
  } else if (module_type(module) === "sensor" || module_type(module) === "sink") {
    module_flowProcessingTime(module, 0);
  } else {
    const moduleProcessingTime = module_baseProcessingTime(module);
    const nodeId = dataFlowModel.nodeToModuleAssignments[moduleId];
    const node = infrastructureModel.nodes.get(nodeId);
    const nodePerformanceFactor = node_performanceIndicator(node);

    if (infrastructureModel.nodesWithMissingMemory.includes(nodeId)) {
      module_flowProcessingTime(module, Number.POSITIVE_INFINITY);
    } else {
      module_flowProcessingTime(module, moduleProcessingTime / nodePerformanceFactor);
    }
  }

  dataFlowModel.modules.update(module);
  return module_flowProcessingTime(module);
}

function getProcessingTimeForModuleWithIdAsString(moduleId) {
  const module = dataFlowModel.modules.get(moduleId);
  const processingTime = module_flowProcessingTime(module);

  if (processingTime === null) {
    return "Module is not reached.";
  } else {
    if (isNaN(processingTime)) {
      return "∞ s";
    } else {
      return round(processingTime, 5) + " s";
    }
  }
}

/**
 * Returns the sum of all processing times of each module.
 *
 * @return {*} - the total processing time, can be "∞", null if no coherent flow was found
 */
function getTotalProcessingTime() {
  if (dataFlowModel.coherentFlowFound === false) {
    return null;
  }

  let totalProcessingTime = 0;
  dataFlowModel.modules.forEach(function(module) {
    totalProcessingTime += module_flowProcessingTime(module);
  });

  return totalProcessingTime;
}

function getTotalProcessingTimeAsString() {
  if (dataFlowModel.coherentFlowFound === false) {
    return "No coherent flow exists.";
  } else {
    const totalProcessingTime = getTotalProcessingTime();
    if (isNaN(totalProcessingTime)) {
      return "∞ s";
    } else {
      return round(totalProcessingTime, 5) + " s";
    }
  }
}

function getTotalProcessingTimeAsNumber() {
  if (dataFlowModel.coherentFlowFound === false) {
    return -1;
  } else {
    const totalProcessingTime = getTotalProcessingTime();
    if (isNaN(totalProcessingTime)) {
      return Inf;
    } else {
      return round(totalProcessingTime, 5);
    }
  }
}

/**
 * Calculates and sets the actual processing cost for the module with the given id that arises every second.
 *
 * Considers under-provisioning (more used memory than available memory on the used node).
 * Example: node{1500mb used, 1000mb available}, module{1000mb required} -> share is 666mb
 *
 * A sensor/sink has always a processing cost of 0.
 *
 * @param moduleId - the module id
 * @return {*} - the processing cost, null if module is not reached
 */
function _calculateProcessingCostForModuleWithId(moduleId) {
  const module = dataFlowModel.modules.get(moduleId);

  if (dataFlowModel.checkModuleWithIdIsReached(moduleId) === false) {
    module_processingCost(module, null);
  } else {
    const requiredMemory = module_requiredMemory(module);
    let price = 0;
    if (requiredMemory > 0) {
      const nodeId = dataFlowModel.nodeToModuleAssignments[moduleId];
      const node = infrastructureModel.nodes.get(nodeId);
      price = node_memoryPrice(node);
    }

    //const underProvisionRatio = infrastructureModel.getMemoryUnderProvisionRatioForNodeWithId(nodeId);

    module_processingCost(module, price);
  }

  dataFlowModel.modules.update(module);
  return module_processingCost(module);
}

function getProcessingCostForModuleWithIdAsString(moduleId) {
  const module = dataFlowModel.modules.get(moduleId);
  const processingCost = module_processingCost(module);

  if (processingCost === null) {
    return "Module is not reached.";
  } else {
    return round(processingCost, 5) + " cent/s";
  }
}

/**
 * Returns the sum of #getProcessingCostForModuleWithId for each module.
 *
 * @return {*} - the total processing cost, undefined if no coherent flow was found
 */
function getTotalProcessingCost() {
  if (dataFlowModel.coherentFlowFound === false) {
    return null;
  }

  let totalProcessingCost = 0;
  dataFlowModel.modules.forEach(function(module) {
    totalProcessingCost += module_processingCost(module);
  });

  return totalProcessingCost;
}


function getTotalProcessingCostAsString() {
  if (dataFlowModel.coherentFlowFound === false) {
    return "No coherent flow exists.";
  } else {
    return round(getTotalProcessingCost(), 5) + " cent/s";
  }
}

/* *****************************************************************
 Transmission Time and Cost
***************************************************************** */

/**
 * Calculates and sets the transmission time (total time data spends on wire) for the dataPath with the given id.
 *
 * Equals ∞, if any of the involved connections misses bandwidth (indicated by being apart of the
 * connectionsWithMissingBandwidth array).
 *
 * @param dataPathId - the dataPath id
 * @return {*} - the transmission time, can be "∞", null if data path is not reached
 */
function _calculateTransmissionTimeForDataPathWithId(dataPathId) {
  const dataPath = dataFlowModel.dataPaths.get(dataPathId);

  if (dataFlowModel.checkDataPathWithIdIsReached(dataPathId) === false) {
    dataPath_transmissionTime(dataPath, null);
  } else {
    const involvedConnections = dataPath_involvedConnections(dataPath);
    let transmissionTime = 0;

    for (let i = 0; i < involvedConnections.length; i++) {
      const connectionId = involvedConnections[i];
      const connection = infrastructureModel.connections.get(connectionId);
      if (infrastructureModel.connectionsWithMissingBandwidth.includes(connectionId)) {
        transmissionTime = "∞";
        break;
      } else {
        transmissionTime += connection_latency(connection);
      }
    }

    dataPath_transmissionTime(dataPath, transmissionTime);
  }

  dataFlowModel.dataPaths.update(dataPath);
  return dataPath_transmissionTime(dataPath);
}

function getTransmissionTimeForDataPathWithIdAsString(dataPathId) {
  const dataPath = dataFlowModel.dataPaths.get(dataPathId);
  const transmissionTime = dataPath_transmissionTime(dataPath);

  if (transmissionTime === null) {
    return "Data path is not reached.";
  } else {
    if (isNaN(transmissionTime)) {
      return "∞ s";
    } else {
      return round(transmissionTime, 5) + " s";
    }
  }
}

/**
 * Returns the sum of #getTransmissionTimeForDataPathWithId for each data path.
 *
 * @return {*} - the total transmission time, can be "∞", null if no coherent flow was found
 */
function getTotalTransmissionTime() {
  if (dataFlowModel.coherentFlowFound === false) {
    return null;
  }

  let totalTransmissionTime = 0;
  dataFlowModel.dataPaths.forEach(function(dataPath) {
    totalTransmissionTime += dataPath_transmissionTime(dataPath);
  });

  return totalTransmissionTime;
}

function getTotalTransmissionTimeAsString() {
  if (dataFlowModel.coherentFlowFound === false) {
    return "No coherent flow exists.";
  } else {
    const totalTransmissionTime = getTotalTransmissionTime();
    if (isNaN(totalTransmissionTime)) {
      return "∞ s";
    } else {
      return round(totalTransmissionTime, 5) + " s";
    }
  }
}

/**
 * Calculates and sets the transmission cost for the dataPath with the given id that arises every second.
 *
 * Considers under-provisioning (more used bandwidth than available bandwidth on the used connection).
 * Example: connection{1500mb used, 1000mb available}, path{1000mb required} -> share is 666mb
 *
 * @param dataPathId - the dataPath id
 * @return {*} - the transmission cost, null if data path is not reached
 */
function _calculateTransmissionCostForDataPathWithId(dataPathId) {
  const dataPath = dataFlowModel.dataPaths.get(dataPathId);

  if (dataFlowModel.checkDataPathWithIdIsReached(dataPathId) === false) {
    dataPath_transmissionCost(dataPath, null);
  } else {
    const requiredBandwidth = dataPath_requiredBandwidth(dataPath);
    let transmissionCost = 0;

    dataPath_involvedConnections(dataPath)
      .forEach(function(connectionId) {
        const connection = infrastructureModel.connections.get(connectionId);
        const price = connection_bandwidthPrice(connection);
        const underProvisionRatio = infrastructureModel.getBandwidthUnderProvisionRatioForConnectionWithId(connectionId);

        transmissionCost += requiredBandwidth / underProvisionRatio * price;
      });

    dataPath_transmissionCost(dataPath, transmissionCost);
  }

  dataFlowModel.dataPaths.update(dataPath);
  return dataPath_transmissionCost(dataPath);
}

function getTransmissionCostForDataPathWithIdAsString(dataPathId) {
  const dataPath = dataFlowModel.dataPaths.get(dataPathId);
  const transmissionCost = dataPath_transmissionCost(dataPath);

  if (transmissionCost === null) {
    return "Data path is not reached.";
  } else {
    return round(transmissionCost, 5) + " cent/s";
  }
}

/**
 * Returns the sum of #getTransmissionCostForDataPathWithId for each data path.
 *
 * @return {*} - the total transmission cost, undefined if no coherent flow was found
 */
function getTotalTransmissionCost() {
  if (dataFlowModel.coherentFlowFound === false) {
    return null;
  }

  let totalTransmissionCost = 0;
  dataFlowModel.dataPaths.forEach(function(dataPath) {
    totalTransmissionCost += dataPath_transmissionCost(dataPath);
  });

  return totalTransmissionCost;
}


function getTotalTransmissionCostAsString() {
  if (dataFlowModel.coherentFlowFound === false) {
    return "No coherent flow exists.";
  } else {
    return round(getTotalTransmissionCost(), 5)
      .toString() + " cent/s";
  }
}

/* *****************************************************************
 Other Flow Metrics
***************************************************************** */

function getFlowMetricsDataRepresentation() {
  const metrics = {};
  metrics["coherentFlowExists"] = dataFlowModel.coherentFlowFound;
  metrics["totalProcessingCost"] = getTotalProcessingCost();
  metrics["totalProcessingTime"] = getTotalProcessingTime();
  metrics["totalTransmissionCost"] = getTotalTransmissionCost();
  metrics["totalTransmissionTime"] = getTotalTransmissionTime();
  metrics["underProvisionedNodes"] = infrastructureModel.nodesWithMissingMemory;
  metrics["underProvisionedConnections"] = infrastructureModel.connectionsWithMissingBandwidth;
  metrics["impossiblePaths"] = dataFlowModel.impossiblePaths;
  return metrics;
}

/* *****************************************************************
 Helper Methods
***************************************************************** */

function round(number, precisionFactor) {
  const factor = Math.pow(10, precisionFactor);
  return Math.round(number * factor) / factor;
}

function arrayContainsObject(array, object) {
  let hasObject = false;

  array.forEach(function(el) {
    if (el === object) {
      hasObject = true;
    }
  });

  return hasObject;
}

function getSetFieldname(fieldName, object, value) {
  if (value !== undefined) {
    object[fieldName] = value;
  } else {
    return object[fieldName];
  }
}

function getSetFieldnameBaseProperties(fieldName, object, value) {
  if (value !== undefined) {
    if (object["baseProperties"] === undefined) {
      object["baseProperties"] = {};
    }
    object["baseProperties"][fieldName] = value;
  } else {
    if (object["baseProperties"] === undefined) {
      return undefined;
    }
    return object["baseProperties"][fieldName];
  }
}

function getSetFieldnameFlowProperties(fieldName, object, value) {
  if (value !== undefined) {
    if (object["flowProperties"] === undefined) {
      object["flowProperties"] = {};
    }
    object["flowProperties"][fieldName] = value;
  } else {
    if (object["flowProperties"] === undefined) {
      return undefined;
    }
    return object["flowProperties"][fieldName];
  }
}

if (module !== undefined) {
  module.exports = {
    loadModels: loadModels,
    getAllDataRepresentation: getAllDataRepresentation,
    setCurrentlySelectedModuleToModuleWithId: setCurrentlySelectedModuleToModuleWithId,
    assignCurrentlySelectedModuleToNodeWithId: assignCurrentlySelectedModuleToNodeWithId,
    calculateCoherentFlow: calculateCoherentFlow,
    getProcessingTimeForModuleWithIdAsString: getProcessingTimeForModuleWithIdAsString,
    getTotalProcessingTime: getTotalProcessingTime,
    getTotalProcessingTimeAsString: getTotalProcessingTimeAsString,
    getProcessingCostForModuleWithIdAsString: getProcessingCostForModuleWithIdAsString,
    getTotalProcessingCost: getTotalProcessingCost,
    getTotalProcessingCostAsString: getTotalProcessingCostAsString,
    getTransmissionTimeForDataPathWithIdAsString: getTransmissionTimeForDataPathWithIdAsString,
    getTotalTransmissionTime: getTotalTransmissionTime,
    getTotalTransmissionTimeAsString: getTotalTransmissionTimeAsString,
    getTransmissionCostForDataPathWithIdAsString: getTransmissionCostForDataPathWithIdAsString,
    getTotalTransmissionCost: getTotalTransmissionCost,
    getTotalTransmissionCostAsString: getTotalTransmissionCostAsString,
    getFlowMetricsDataRepresentation: getFlowMetricsDataRepresentation,
    round: round,
    arrayContainsObject: arrayContainsObject,
    getSetFieldname: getSetFieldname,
    getSetFieldnameBaseProperties: getSetFieldnameBaseProperties,
    getSetFieldnameFlowProperties: getSetFieldnameFlowProperties,
  };
}
