class DataFlowController {

    constructor() {
        this.moduleView = new DataFlowView();
        this.moduleView.drawGraph(dataFlowModel.modules, dataFlowModel.dataPaths);
        this._activateEventsOnGraph();
    }

    _activateEventsOnGraph() {
        const that = this;

        this.moduleView.network.on("selectNode", function (params) {

            const moduleId = this.getNodeAt(params.pointer.DOM);

            dataFlowModel.currentlySelectedModuleId = moduleId;

            informationCardController.updateDataflowCard(moduleId, undefined);
            informationCardController.updateFlowSelectionMetricsCard(moduleId, null);

            console.log("Module " + moduleId + " is selected");
        });

        this.moduleView.network.on("deselectNode", function (params) {

            const moduleId = params.previousSelection.nodes[0];

            dataFlowModel.currentlySelectedModuleId = null;

            informationCardController.updateDataflowCard(undefined, undefined);
            informationCardController.updateFlowSelectionMetricsCard(null, null);

            console.log("Module " + moduleId + " has been deselected");
        });

        this.moduleView.network.on("selectEdge", function (params) {
            const dataPathId = this.getEdgeAt(params.pointer.DOM);

            InfrastructureController.tryToHighlightSingleDataPath(dataPathId);
            informationCardController.updateDataflowCard(undefined, dataPathId);
            informationCardController.updateFlowSelectionMetricsCard(null, dataPathId);
            
        });

        this.moduleView.network.on("deselectEdge", function () {
            informationCardController.updateFlowSelectionMetricsCard(null, null);

            InfrastructureController.tryToHighlightCoherentFlow();
            informationCardController.updateDataflowCard(undefined, undefined);
            informationCardController.updateFlowMetricsCard();
        });
    }

}
