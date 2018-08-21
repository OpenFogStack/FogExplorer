class InfrastructureController {

    constructor() {
        this.infrastructureView = new InfrastructureView();
        this.infrastructureView.drawGraph(infrastructureModel.nodes, infrastructureModel.connections);
        this._activateEventsOnGraph();
    }

    _activateEventsOnGraph() {
        this.infrastructureView.network.on("click", function (params) {

            // identify clicked object
            const nodeId = this.getNodeAt(params.pointer.DOM);
            let connectionId = this.getEdgeAt(params.pointer.DOM);

            informationCardController.updateInfrastructureCard(nodeId, connectionId);

            // we clicked a node
            if (nodeId !== undefined) {

                if (dataFlowModel.currentlySelectedModuleId !== undefined) {
                    const lastAssignedNodeId = assignCurrentlySelectedModuleToNodeWithId(nodeId);

                    // Redraw the node the module was last assigned to
                    if (lastAssignedNodeId !== undefined) {
                        InfrastructureController.updateNodeImageWithColors(lastAssignedNodeId,
                            dataFlowModel.getColorsForNodeWithId(lastAssignedNodeId));
                    }

                    // Redraw the clicked node
                    InfrastructureController.updateNodeImageWithColors(nodeId,
                        dataFlowModel.getColorsForNodeWithId(nodeId));

                    // Calculate the coherent flow and highlight it
                    calculateCoherentFlow();
                    InfrastructureController.tryToHighlightCoherentFlow();
                    informationCardController.updateFlowMetricsCard();
                }


            } else if (connectionId !== undefined) {
                // nothing to do here
            }
        });
    }

    /**
     * Updates the image of the node with the given id by an image that includes all the given colors.
     * If no array is given, a standard color is chosen.
     *
     * If this methods detects that the node misses memory, this is put into the image as well.
     *
     * @param nodeId - the id of the node
     * @param colorArray - an array containing all colors that should be in the node
     */
    static updateNodeImageWithColors(nodeId, colorArray) {
        let missesMemory = false;
        if (infrastructureModel.nodesWithMissingMemory.includes(nodeId)) {
            missesMemory = true;
        }

        if (colorArray !== undefined) {
            console.log("Redrawing node " + nodeId + ", it has " + colorArray.length + " modules assigned.");
        } else {
            console.log("Redrawing node " + nodeId + " with standard color.");
        }

        infrastructureModel.updateImageOfNodeWithId(nodeId,
            InfrastructureView.buildNodeSVGImage(colorArray, missesMemory));
    }

    /**
     * Highlights the connections with the given ids.
     * @param connectionIds
     */
    static highlightConnectionsWithIds(connectionIds) {
        const color = {
            color: "#fd1d11",
            highlight: "#fd1d11"
        };
        infrastructureModel.setConnectionColorsForGivenIds(connectionIds, color);
    }

    static markDataStreamWithIdsAsGuilty(dataStreamIds) {
        const color = {
            color: "#fdc235",
            highlight: "#fdc235"
        };
        if (dataStreamIds != null) {
            dataFlowModel.setDataStreamColorForGivenIds(dataStreamIds, color);
        }
    }

    /**
     * Removes the highlighting of all connections.
     */
    static resetAllConnectionHighlighting() {
        const color = null;
        infrastructureModel.setAllConnectionColors(color);
        dataFlowModel.setAllConnectionColors(color);
    }

    static tryToHighlightCoherentFlow() {
        InfrastructureController.resetAllConnectionHighlighting();
        if (dataFlowModel.coherentFlowFound) {
            console.log("Highlighting coherent flow");
            dataFlowModel.dataPaths.forEach(function (dataPath) {
                InfrastructureController.highlightConnectionsWithIds(dataPath_involvedConnections(dataPath));
            });
        } else if (dataFlowModel.checkAllModulesAssigned()) {
            // maybe some paths are available, so lets highlight them
            // Note: after each module assignment, the list of involved connections is cleared by recalculating the path
            dataFlowModel.dataPaths.forEach(function (dataPath) {
                const involvedConnections = dataPath_involvedConnections(dataPath);
                if (involvedConnections !== undefined && involvedConnections.length > 0) {
                    InfrastructureController.highlightConnectionsWithIds(dataPath_involvedConnections(dataPath));
                } else {
                    InfrastructureController.markDataStreamWithIdsAsGuilty(dataPath_notReachedBecauseOfDataPath(dataPath));
                }
            });
        }
    }

    static tryToHighlightSingleDataPath(dataPathId) {
        InfrastructureController.resetAllConnectionHighlighting();
        if (dataFlowModel.checkAllModulesAssigned()) {
            console.log("Highlighting single data path: " + dataPathId);
            const dataPath = dataFlowModel.dataPaths.get(dataPathId);
            InfrastructureController.highlightConnectionsWithIds(dataPath_involvedConnections(dataPath));
        }
    }

}
