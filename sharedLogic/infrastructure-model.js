class InfrastructureModel {
  constructor(json) {
    const datasets = this._validateJsonAndBuildDataSets(json);

    this.nodes = datasets.nodes;
    this.connections = datasets.connections;
  }

  resetAndInitialize() {
    this.nodesWithMissingMemory = [];
    this.connectionsWithMissingBandwidth = [];

    this.resetCalculatedFlowInformation();
  }

  /**
   * Flow properties are reset in #resetCalculatedFlowInformation
   * @param json
   * @return {{nodes: *|DataSet, connections: *|DataSet}}
   * @private
   */
  _validateJsonAndBuildDataSets(json) {
    // TODO validate dataset
    const nodes = new vis.DataSet(json.nodes);
    const connections = new vis.DataSet(json.connections);

    // prepare the nodes dataset
    nodes.forEach(function(n) {
      n["shape"] = "image"; // so that an image can be set by views

      // Node memory is not set in #calculateCoherentFlow
      node_usedMemory(n, 0);
      nodes.update(n);
    });

    return {
      nodes: nodes,
      connections: connections
    };
  }

  getNodesDataRepresentation() {
    const nodes = this.nodes.get();

    // now we remove some fields only of interest to the evaluator
    nodes.forEach(function(node) {
      delete node["shape"];
      delete node["color"];
      delete node["image"];
      delete node["margin"];
    });

    return nodes;
  }

  getConnectionsDataRepresentation() {
    const connections = this.connections.get();

    // now we remove some fields only of interest to the evaluator
    connections.forEach(function(connection) {
      delete connection["color"];
      delete connection["margin"];
    });

    return connections;
  }

  /**
   * Clears all information set in evaluator.calculateCoherentFlow;
   *
   */
  resetCalculatedFlowInformation() {
    const that = this;
    this.connections.forEach(function(c) {
      connection_usedBandwidth(c, 0);
      that.connections.update(c);
    });
    this.connectionsWithMissingBandwidth = [];
  }

  /**
   *
   * @param requiredBandwidth - the bandwidth all connections must have to be considered
   * @return {{}}
   */
  getDijkstraProblemForInfrastructure(requiredBandwidth) {
    let problem = {};

    // add nodes to dictionary
    this.nodes.forEach(function(node) {
      problem[node_id(node)] = {};
    });

    // add possible path and weight to dictionary
    this.connections.forEach(function(connection) {
      const weighting = InfrastructureModel._calculateDijkstraWeighting(
        connection,
        requiredBandwidth
      );
      if (weighting !== -1) {
        // only path that do not exceed bandwidth
        problem[connection_from(connection)][
          connection_to(connection)
        ] = weighting;
      }
    });

    return problem;
  }

  /**
   * Calculates the weighting needed for the Dijkstra algorithm for a given edge.
   *
   * If a connection's available bandwidth < given required bandwidth, this method returns -1.
   *
   *
   * @param connection - the connection
   * @param requiredBandwidth - the bandwidth required by the module [default = 0]
   * @returns {number} the weight for Dijkstra or -1 (see above)
   */
  static _calculateDijkstraWeighting(connection, requiredBandwidth) {
    let rBandwidth = requiredBandwidth; // otherwise we cannot re-assign

    if (requiredBandwidth === undefined) {
      rBandwidth = 0;
    }

    if (connection_availableBandwidth(connection) < rBandwidth) {
      return -1;
    }

    return connection_latency(connection);
  }

  /* *****************************************************************
   Edge Management
  ***************************************************************** */

  /**
   * Adds an amount to the used bandwidth property of a connection. Also manages the
   * connectionsWithMissingBandwidth array.
   *
   * @param connectionId - the id of the connection
   * @param amount - the additional used bandwidth
   */
  addUsedBandwidthToConnectionWithId(connectionId, amount) {
    const connection = this.connections.get(connectionId);
    const oldUsedBandwidth = connection_usedBandwidth(connection);
    // set used bandwidth to old + amount
    connection_usedBandwidth(connection, oldUsedBandwidth + amount);
    this.connections.update(connection);

    if (
      connection_usedBandwidth(connection) >
      connection_availableBandwidth(connection)
    ) {
      if (
        this.connectionsWithMissingBandwidth.includes(connectionId) === false
      ) {
        this.connectionsWithMissingBandwidth.push(connectionId);
        //console.log("Connection " + connectionId + " now exceeds its available bandwidth.");
      }
    }
  }

  /**
   * Removes an amount from the used bandwidth property of a connection. Also manages
   * the connectionsWithMissingBandwidth array.
   *
   * @param connectionId - the id of the connection
   * @param amount - the to be removed bandwidth
   */
  removeUsedBandwidthFromConnectionWithId(connectionId, amount) {
    const connection = this.connections.get(connectionId);
    const oldUsedBandwidth = connection_usedBandwidth(connection);
    // set used bandwidth to old + amount
    connection_usedBandwidth(connection, oldUsedBandwidth + amount);

    if (connection_usedBandwidth(connection) < 0) {
      connection_usedBandwidth(connection, 0); // cannot be smaller than 0
    }

    this.connections.update(connection);

    if (
      this.connectionsWithMissingBandwidth.includes(connectionId) &&
      connection_usedBandwidth(connection) <=
        connection_availableBandwidth(connection)
    ) {
      const index = this.connectionsWithMissingBandwidth.indexOf(connectionId);
      if (index >= 0) {
        this.connectionsWithMissingBandwidth.splice(index, 1);
      }
      //console.log("Connection " + connectionId + " does not exceed its available bandwidth anymore.");
    }
  }

  /**
   * Returns the under-provision ratio of the connection with the given id. The ratio is 1, if the connection is not
   * under-provisioned.
   *
   * @param connectionId - the id of the connection
   * @return {number} - the under-provision ratio
   */
  getBandwidthUnderProvisionRatioForConnectionWithId(connectionId) {
    if (this.connectionsWithMissingBandwidth.includes(connectionId)) {
      const connection = this.connections.get(connectionId);
      return (
        connection_usedBandwidth(connection) /
        connection_availableBandwidth(connection)
      );
    } else {
      // connection is not underprovisioned
      return 1;
    }
  }

  /**
   * Returns the connectionId of the connection that connects two nodes.
   *
   * @param nodeId1 - The id of the initial node
   * @param nodeId2 - The id of the final node
   * @return {undefined} if none present, otherwise the connectionId
   */
  getConnectionIdBetweenNodes(nodeId1, nodeId2) {
    let connectionId = undefined;

    this.connections.forEach(function(c) {
      if (
        String(connection_from(c)) === String(nodeId1) &&
        String(connection_to(c)) === String(nodeId2)
      ) {
        const cId = connection_id(c);

        if (connectionId !== undefined) {
          //console.log("THERE IS MORE THAN ONE CONNECTION BETWEEN NODES " + nodeId1 + " AND " + nodeId2);
        }

        connectionId = cId; // we take the last one
      }
    });

    if (connectionId === undefined) {
      //console.log("THERE IS NO CONNECTION BETWEEN NODES " + nodeId1 + " AND " + nodeId2);
    }

    return connectionId;
  }

  /**
   * Sets the color property of connections with the given ids to the content of the given object.
   *
   * @param connectionIds - the ids of the connection whose color is set
   * @param colorObject - the color
   */
  setConnectionColorsForGivenIds(connectionIds, colorObject) {
    const that = this;
    connectionIds.forEach(function(connectionId) {
      const connection = that.connections.get(connectionId);
      connection["color"] = colorObject;
      that.connections.update(connection);
    });
  }

  /**
   * Sets the color property of every connection to the content of the given object.
   *
   * @param colorObject - the color
   */
  setAllConnectionColors(colorObject) {
    const that = this;
    this.connections.forEach(function(connection) {
      connection.color = colorObject;
      that.connections.update(connection);
    });
  }

  /* *****************************************************************
  Node Management
  ***************************************************************** */

  /**
   * Adds an amount to the used memory property of a node. Also manages the nodesWithMissingMemory array.
   *
   * @param nodeId - the id of the node
   * @param amount - the additional used memory
   */
  addUsedMemoryToNodeWithId(nodeId, amount) {
    if (amount === undefined) {
      return; // fine, because only function modules have an amount
    }
    const node = this.nodes.get(nodeId);
    const oldUsedMemory = node_usedMemory(node);
    node_usedMemory(node, oldUsedMemory + amount);
    this.nodes.update(node);

    if (node_usedMemory(node) > node_availableMemory(node)) {
      if (this.nodesWithMissingMemory.includes(nodeId) === false) {
        this.nodesWithMissingMemory.push(nodeId);
        //console.log("Node " + nodeId + " now exceeds its available memory.");
      }
    }
  }

  /**
   * Removes an amount from the used memory property of a node. Also manages the nodesWithMissingMemory array.
   *
   * @param nodeId - the id of the node
   * @param amount - the to be removed memory
   */
  removeUsedMemoryFromNodeWithId(nodeId, amount) {
    if (amount === undefined) {
      return; // fine, because only function modules have an amount
    }

    const node = this.nodes.get(nodeId);
    const oldUsedMemory = node_usedMemory(node);
    // set used memory to old + amount
    node_usedMemory(node, oldUsedMemory - amount);

    if (node_usedMemory(node) < 0) {
      node_usedMemory(node, 0); // cannot be smaller than 0
    }

    this.nodes.update(node);

    if (
      this.nodesWithMissingMemory.includes(nodeId) &&
      node_usedMemory(node) <= node_availableMemory(node)
    ) {
      const index = this.nodesWithMissingMemory.indexOf(nodeId);
      if (index >= 0) {
        this.nodesWithMissingMemory.splice(index, 1);
      }
      //console.log("Node " + nodeId + " does not exceed its available memory anymore.")
    }
  }

  /**
   * Returns the under-provision ratio of the node with the given id. The ratio is 1, if the connection is not
   * under-provisioned.
   *
   * @param nodeId - the id of the node
   * @return {number} - the under-provision ratio
   */
  getMemoryUnderProvisionRatioForNodeWithId(nodeId) {
    if (this.nodesWithMissingMemory.includes(nodeId)) {
      const node = this.nodes.get(nodeId);
      return node_usedMemory(node) / node_availableMemory(node);
    } else {
      // node is not underprovisioned
      return 1;
    }
  }

  /**
   * Update the image of the node with the given id.
   *
   * @param nodeId - the id of the node
   * @param image - the image
   */
  updateImageOfNodeWithId(nodeId, image) {
    const node = this.nodes.get(nodeId);
    node["image"] = image;
    this.nodes.update(node);
  }
}

/* *****************************************************************
 Nodes - Globally Available Node Helper Methods
***************************************************************** */

function node_id(object) {
  const fieldName = "id";
  return getSetFieldname(fieldName, object, undefined);
}

function node_label(object) {
  const fieldName = "label";
  return getSetFieldname(fieldName, object, undefined);
}

function node_availableMemory(object, value) {
  const fieldName = "availableMemory"; // implicit unit: mb
  return getSetFieldnameBaseProperties(fieldName, object, value);
}

function node_usedMemory(object, value) {
  const fieldName = "usedMemory"; // implicit unit: mb
  return getSetFieldnameFlowProperties(fieldName, object, value);
}

function node_memoryPrice(object, value) {
  const fieldName = "memoryPrice"; // implicit unit: cent/mb/s
  return getSetFieldnameBaseProperties(fieldName, object, value);
}

function node_performanceIndicator(object, value) {
  const fieldName = "performanceIndicator"; // implicit unit: pi
  return getSetFieldnameBaseProperties(fieldName, object, value);
}

/* *****************************************************************
 Connections - Globally Available Connection Helper Methods
***************************************************************** */

function connection_id(object) {
  const fieldName = "id";
  return getSetFieldname(fieldName, object, undefined);
}

function connection_from(object) {
  const fieldName = "from";
  return getSetFieldname(fieldName, object, undefined);
}

function connection_to(object) {
  const fieldName = "to";
  return getSetFieldname(fieldName, object, undefined);
}

function connection_bandwidthPrice(object, value) {
  const fieldName = "bandwidthPrice"; // implicit unit: cent/kb
  return getSetFieldnameBaseProperties(fieldName, object, value);
}

function connection_availableBandwidth(object, value) {
  const fieldName = "availableBandwidth"; // implicit unit: kb/s
  return getSetFieldnameBaseProperties(fieldName, object, value);
}

function connection_usedBandwidth(object, value) {
  const fieldName = "usedBandwidth"; // implicit unit: kb/s
  return getSetFieldnameFlowProperties(fieldName, object, value);
}

function connection_latency(object, value) {
  const fieldName = "latency"; // implicit unit: s
  return getSetFieldnameBaseProperties(fieldName, object, value);
}

// NODE COMPATIBILITY
if (module !== undefined) {
  module.exports = {
    InfrastructureModel: InfrastructureModel,
    node_id: node_id,
    node_label: node_label,
    node_availableMemory: node_availableMemory,
    node_usedMemory: node_usedMemory,
    node_memoryPrice: node_memoryPrice,
    node_performanceFactor: node_performanceIndicator,
    connection_id: connection_id,
    connection_from: connection_from,
    connection_to: connection_to,
    connection_bandwidthPrice: connection_bandwidthPrice,
    connection_availableBandwidth: connection_availableBandwidth,
    connection_usedBandwidth: connection_usedBandwidth,
    connection_latency: connection_latency
  };
}
