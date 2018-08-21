class DataFlowModel {

    constructor(json) {
        const datasets = this._validateJsonAndBuildDataSets(json);

        this.modules = datasets.modules;
        this.dataPaths = datasets.dataPaths;
        this.nodeToModuleAssignments = datasets.nodeToModuleAssignments; // moduleId -> nodeId
    }

    resetAndInitialize() {
        this.currentlySelectedModuleId = null; // moduleId
        this.coherentFlowFound = false; // true, when a coherent flow from all sensors to all sinks was found
        this.impossiblePaths = [];

        this.resetCalculatedFlowInformation();
        this._calculateBandwidthConsumptions();
    }

    /**
     * Flow properties are reset in #resetCalculatedFlowInformation
     * @param json
     * @return {{modules: *|DataSet, dataPaths: *|DataSet, nodeToModuleAssignments: {}}}
     * @private
     */
    _validateJsonAndBuildDataSets(json) {
        // TODO validate dataset

        const modules = new vis.DataSet(json.modules);
        const dataPaths = new vis.DataSet(json.dataPaths);
        let nodeToModuleAssignments = {};
        if (json.placements !== undefined) {
            nodeToModuleAssignments = json.placements;
        }

        modules.forEach(function (m) {
            // set color of each module (this is a model task, because colors are used for calculations)
            const color = randomColor({
                luminosity: 'light'
            });
            m.color = {
                background: color,
                highlight: {
                    border: "#fd1d11",
                    background: color
                },
                border: color
            };
            m.shape = "box";
            m.margin = 10;

            modules.update(m);
        });

        dataPaths.forEach(function (dp) {
            // Required bandwidth is not set in #calculateCoherentFlow
            dataPath_requiredBandwidth(dp, null);
            dataPaths.update(dp);
        });

        return {modules: modules, dataPaths: dataPaths, nodeToModuleAssignments: nodeToModuleAssignments};
    }

    getModulesDataRepresentation() {
        const modules = this.modules.get();

        // now we remove some fields only of interest to the evaluator
        modules.forEach(function (module) {
            delete module["shape"];
            delete module["color"];
            delete module["image"];
            delete module["margin"];
        });

        return modules;
    }

    getDataPathsDataRepresentation() {
        const dataPaths = this.dataPaths.get();

        // now we remove some fields only of interest to the evaluator
        dataPaths.forEach(function (dataPath) {
            delete dataPath["color"];
            delete dataPath["margin"];
        });

        return dataPaths;
    }

    /**
     * Clears all information set in evaluator.calculateCoherentFlow;
     *
     */
    resetCalculatedFlowInformation() {
        const that = this;
        this.dataPaths.forEach(function (dataPath) {
            dataPath_involvedConnections(dataPath, []);
            dataPath_notReachedBecauseOfDataPath(dataPath, []);
            dataPath_transmissionTime(dataPath, null);
            dataPath_transmissionCost(dataPath, null);
            that.dataPaths.update(dataPath);
        });

        this.modules.forEach(function (module) {
            module_notReachedBecauseOfDataPath(module, []);
            module_flowProcessingTime(module, null);
            module_processingCost(module, null);

            switch (module_type(module)) {
                case "sensor":
                    break;
                case "function":
                    module_notReachedBecauseOfDataPath(module, []);
                    break;
                case "sink":
                    module_notReachedBecauseOfDataPath(module, []);
                    break;
            }

            that.modules.update(module);
        });
        this.coherentFlowFound = false;
        this.impossiblePaths = [];
    }

    /* *****************************************************************
     Module Management
    ***************************************************************** */

    /**
     * Checks whether all modules are assigned to a node.
     *
     * @return {boolean}
     */
    checkAllModulesAssigned() {
        const that = this;

        // forEach would be possible too, but let's use another way
        const notAssignedModuleIds = this.modules.get({
            filter: function (module) {
                return (that.nodeToModuleAssignments[module.id] === undefined);
            }
        });

        return (notAssignedModuleIds.length === 0);
    }

    checkModuleWithIdIsReached(moduleId) {
        const module = this.modules.get(moduleId);
        if (module_type(module) === "sensor") {
            return true;
        }

        return module_notReachedBecauseOfDataPath(module).length === 0;
    }

    /**
     * Returns an array of all modules assigned to a given nodeId. Returns undefined,
     * if the array is empty.
     * @param nodeId - the nodeId
     */
    getIdsOfModulesAssignedToNodeWithId(nodeId) {
        let array = [];

        for (let moduleId in this.nodeToModuleAssignments) {
            // check not defined in parent
            if (this.nodeToModuleAssignments.hasOwnProperty(moduleId)) {
                const assignedNodeId = this.nodeToModuleAssignments[moduleId];
                if (assignedNodeId === nodeId) {
                    array.push(moduleId);
                }
            }
        }

        if (array.length === 0) {
            return undefined;
        }

        return array;
    }

    /**
     * Get the colors of all modules that are assigned to a node with a given node id.
     *
     * @param nodeId - the id of the node
     */
    getColorsForNodeWithId(nodeId) {
        const assignedModuleIds = this.getIdsOfModulesAssignedToNodeWithId(nodeId);

        if (assignedModuleIds === undefined) {
            // node has no assigned modules
            return undefined;
        }

        const colors = [];
        for (let assignedModuleId of assignedModuleIds) {
            const assignedModule = this.modules.get(assignedModuleId);
            colors.push(module_color(assignedModule));
        }
        return colors;
    }

    /**
     *
     * Calculates the bandwidth a data path requires for connections it uses.
     *
     */
    _calculateBandwidthConsumptions() {
        // it is possible that the dataset already contains required bandwidths -> remove them
        const that = this;
        this.dataPaths.forEach(function (dataPath) {
            dataPath_requiredBandwidth(dataPath, null);
            that.dataPaths.update(dataPath);
        });

        const dataPathsLeft = this.dataPaths.get();
        const processedPathIds = [];
        let changedSomethingLastRound = true;

        while (changedSomethingLastRound) {
            changedSomethingLastRound = false;
            for (let i = 0; i < dataPathsLeft.length; i++) {
                const dataPath = dataPathsLeft[i];
                const module = this.modules.get(dataPath_from(dataPath));
                const modeDivisor = this._calculateModeDivisorForModuleWithId(module_id(module), module_mode(module));

                if (module_type(module) === "sensor") {
                    // case 1: module is sensor -> set to output rate
                    dataPath_requiredBandwidth(dataPath, module_outputRate(module) / modeDivisor);
                    this.dataPaths.update(dataPath);
                    dataPathsLeft.splice(i, 1);
                    i--;
                    processedPathIds.push(dataPath_id(dataPath));
                    changedSomethingLastRound = true;
                } else {
                    // case 2: module is not a sensor -> sum up all prior required bandwidths
                    const sumRequiredBandwidth = this._sumUpPriorRequiredBandwidthForModuleWithId(
                        module_id(module), processedPathIds);

                    if (sumRequiredBandwidth === undefined) {
                        // one prior data path did not have a required bandwidth yet :/
                    } else {
                        // all prior data path had a bandwidth
                        dataPath_requiredBandwidth(dataPath,
                            sumRequiredBandwidth * module_outputRatio(module) / modeDivisor);
                        this.dataPaths.update(dataPath);
                        dataPathsLeft.splice(i, 1);
                        i--;
                        processedPathIds.push(dataPath_id(dataPath));
                        changedSomethingLastRound = true;
                    }
                }

            }
        }
        console.log("Calculated all required bandwidths.");
    }

    _calculateModeDivisorForModuleWithId(moduleId, mode) {
        let divisor = 1;

        if (mode === "total") {
            divisor--; // because we start with 0
            // divisor = number of outgoing edges
            this.dataPaths.forEach(function (dataPath) {
               if (dataPath_from(dataPath) === moduleId) {
                   divisor++;
               }
            });
        }

        return divisor;
    }

    _sumUpPriorRequiredBandwidthForModuleWithId(moduleId, processedPathIds) {
        const dataPaths = this.dataPaths.get();
        let sumRequiredBandwidth = 0;
        for (let i = 0; i < dataPaths.length; i++) {
            const dp = dataPaths[i];
            if (dataPath_to(dp) === moduleId) {
                // we found a relevant path, let's see whether we have already processed it
                if (processedPathIds.includes(dataPath_id(dp))) {
                    sumRequiredBandwidth += dataPath_requiredBandwidth(dp);
                } else {
                    return undefined;
                }
            }
        }
        return sumRequiredBandwidth;
    }

    /**
     * Sets the information of the module with the given id to values that
     * indicate that it is not reached.
     *
     * @param moduleId
     * @param notReachedBecauseOfDataPathWithId - the reason why it is not reached
     */
    setModuleWithIdToNotReached(moduleId, notReachedBecauseOfDataPathWithId) {
        const module = this.modules.get(moduleId);
        const arr = module_notReachedBecauseOfDataPath(module);
        if (arr.includes(notReachedBecauseOfDataPathWithId)) {
            // already stored
        } else {
            arr.push(notReachedBecauseOfDataPathWithId);
            module_notReachedBecauseOfDataPath(module, arr);
        }
        this.modules.update(module);
    }

    /* *****************************************************************
     DataPaths Management
    ***************************************************************** */

    /**
     * Sets the color property of data streams with the given ids to the content of the given object.
     *
     * @param dataStreamIds - the ids of the data streams whose color is set
     * @param colorObject - the color
     */
    setDataStreamColorForGivenIds(dataStreamIds, colorObject) {
        const that = this;
        dataStreamIds.forEach(function (dataStreamId) {
            const dataStream = that.dataPaths.get(dataStreamId);
            dataStream["color"] = colorObject;
            that.dataPaths.update(dataStream);
        });
    }

    /**
     * Sets the color property of every data stream to the content of the given object.
     *
     * @param colorObject - the color
     */
    setAllConnectionColors(colorObject) {
        const that = this;
        this.dataPaths.forEach(function (dataPath) {
            dataPath.color = colorObject;
            that.dataPaths.update(dataPath);
        });
    }

    checkDataPathWithIdIsReached(dataPathId) {
        const dataPath = this.dataPaths.get(dataPathId);
        return dataPath_notReachedBecauseOfDataPath(dataPath).length === 0;
    }

    checkDataPathWithIdIsNotPossibleDataPath(dataPathId) {
        const dataPath = this.dataPaths.get(dataPathId);
        // noinspection RedundantIfStatementJS
        if (dataPath_notReachedBecauseOfDataPath(dataPath).contains(dataPathId)) {
            return true;
        }
        return false;
    }

    /**
     *
     * Adds information needed for the flow to a data path.
     *
     * @param flowInformation - expected format:
     *  {
     *      dataPathId: ""
     *      involvedConnectionIds: []
     *  }
     */
    addFlowInformationToDataPath(flowInformation) {
        const id = flowInformation["dataPathId"];
        const icIDs = flowInformation["involvedConnectionIds"];

        if (id === undefined || icIDs === undefined) {
            console.log("WARNING: Malformed information received: " + JSON.stringify(flowInformation));
        }

        const dataPath = this.dataPaths.get(id);
        dataPath_involvedConnections(dataPath, icIDs);
        this.dataPaths.update(dataPath);
    }

    /**
     * Sets the information of the data path with the given id to values that
     * indicate that it is not reached.
     *
     * @param dataPathId
     * @param notReachedBecauseOfDataPathWithId - the reason why it is not reached
     */
    setDataPathWithIdToNotReached(dataPathId, notReachedBecauseOfDataPathWithId) {
        const dataPath = this.dataPaths.get(dataPathId);
        dataPath_involvedConnections(dataPath, []);
        const arr = dataPath_notReachedBecauseOfDataPath(dataPath);
        if (arr.includes(notReachedBecauseOfDataPathWithId)) {
            // already stored
        } else {
            arr.push(notReachedBecauseOfDataPathWithId);
            dataPath_notReachedBecauseOfDataPath(dataPath, arr);
        }
        this.dataPaths.update(dataPath);
    }

    /**
     * If all shortest path information is available, this method returns all connection ids involved
     * in the shortest path.
     *
     * @return {*} - see above, if not available returns undefined;
     */
    getAllInvolvedConnectionIds() {
        if (this.coherentFlowFound === false) {
            return undefined;
        }

        let involvedConnections = [];
        this.dataPaths.forEach(function (dataPath) {
            involvedConnections = involvedConnections.concat(dataPath_involvedConnections(dataPath));
        });
        return involvedConnections;
    }

}


/* *****************************************************************
 Modules - Globally Available Module Helper Methods
***************************************************************** */

function module_id(object, value) {
    const fieldName = "id";
    return getSetFieldname(fieldName, object, value);
}

function module_label(object, value) {
    const fieldName = "label";
    return getSetFieldname(fieldName, object, value);
}

function module_type(object, value) {
    const fieldName = "type"; // sensor, service, or sink
    return getSetFieldname(fieldName, object, value);
}

function  module_mode(object, value) {
    const fieldName = "mode"; // individual or total
    return getSetFieldnameBaseProperties(fieldName, object, value);
}

function module_outputRate(object, value) {
    const fieldName = "outputRate"; // implicit unit: kb/s
    return getSetFieldnameBaseProperties(fieldName, object, value);
}

function module_outputRatio(object, value) {
    const fieldName = "outputRatio";
    return getSetFieldnameBaseProperties(fieldName, object, value);
}

function module_baseProcessingTime(object, value) {
    const fieldName = "referenceProcessingTime"; // implicit unit: s/pi
    return getSetFieldnameBaseProperties(fieldName, object, value);
}

function module_requiredMemory(object, value) {
    const fieldName = "requiredMemory"; // implicit unit: mb
    return getSetFieldnameBaseProperties(fieldName, object, value);
}

function module_color(module) {
    return module["color"]["background"];
}

function module_notReachedBecauseOfDataPath(object, value) {
    const fieldName = "notReachedBecauseOfDataPath";
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

function module_flowProcessingTime(object, value) {
    const fieldName = "actualProcessingTime"; // implicit unit: s
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

function module_processingCost(object, value) {
    const fieldName = "processingCost"; // implicit unit: cent
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

/* *****************************************************************
 DataPaths - Globally Available Data Path Helper Methods
***************************************************************** */

function dataPath_id(object, value) {
    const fieldName = "id";
    return getSetFieldname(fieldName, object, value);
}

function dataPath_from(object, value) {
    const fieldName = "from";
    return getSetFieldname(fieldName, object, value);
}

function dataPath_to(object, value) {
    const fieldName = "to";
    return getSetFieldname(fieldName, object, value);
}

function dataPath_requiredBandwidth(object, value) {
    const fieldName = "requiredBandwidth"; // implicit unit: kb/s
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

function dataPath_involvedConnections(object, value) {
    const fieldName = "involvedConnections";
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

function dataPath_notReachedBecauseOfDataPath(object, value) {
    const fieldName = "notReachedBecauseOfDataPath";
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

function dataPath_transmissionTime(object, value) {
    const fieldName = "transmissionTime"; // implicit unit: s
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

function dataPath_transmissionCost(object, value) {
    const fieldName = "transmissionCost"; // implicit unit: cent
    return getSetFieldnameFlowProperties(fieldName, object, value);
}

// NODE COMPATIBILITY
if (module !== undefined) {
    module.exports = {
        DataFlowModel: DataFlowModel,
        module_id: module_id,
        module_label: module_label,
        module_type: module_type,
        module_mode: module_mode,
        module_outputRate: module_outputRate,
        module_outputRatio: module_outputRatio,
        module_processingTime: module_baseProcessingTime,
        module_requiredMemory: module_requiredMemory,
        module_color: module_color,
        module_notReachedBecauseOfDataPath: module_notReachedBecauseOfDataPath,
        module_flowProcessingTime: module_flowProcessingTime,
        module_processingCost: module_processingCost,
        dataPath_id: dataPath_id,
        dataPath_from: dataPath_from,
        dataPath_to: dataPath_to,
        dataPath_requiredBandwidth: dataPath_requiredBandwidth,
        dataPath_involvedConnections: dataPath_involvedConnections,
        dataPath_notReachedBecauseOfDataPath: dataPath_notReachedBecauseOfDataPath,
        dataPath_transmissionTime: dataPath_transmissionTime,
        dataPath_transmissionCost: dataPath_transmissionCost
    };
}
