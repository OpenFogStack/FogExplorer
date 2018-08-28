class InformationCardController {

    constructor() {
        this.flowMetricsCard = new CardManager("#flowMetricsCard");
        this.selectionMetricsCard = new CardManager("#selectionMetricsCard");
        this.infrastructureCard = new CardManager("#infrastructureCard");
        this.dataFlowCard = new CardManager("#dataFlowCard");
    }

    /**
     * Update the information in the flow metrics card.
     *
     */
    updateFlowMetricsCard() {

        let keyValues = [];

        this.flowMetricsCard.updateHeadlineText("Total Metrics");

        if (dataFlowModel.coherentFlowFound) {
            keyValues = [
                {key: "Total transmission cost: ", value: getTotalTransmissionCostAsString()},
                {key: "Total transmission time: ", value: getTotalTransmissionTimeAsString()},
                {key: "Total processing cost: ", value: getTotalProcessingCostAsString()},
                {key: "Total processing time: ", value: getTotalProcessingTimeAsString()}
            ];
        } else {
            keyValues = [
                {key: "Currently, not all modules are placed or can be reached.", value: ""}
            ];
        }

        const rows = CardManager.generateTableRows(keyValues);
        this.flowMetricsCard.updateTableContentWithRows(rows);
        this.flowMetricsCard.showCard();

    }

    /**
     * Updates the flow information, for the given module/data stream, if all modules are assigned.
     *
     * @param moduleId
     * @param dataPathId
     */
    updateFlowSelectionMetricsCard(moduleId, dataPathId) {

        let keyValues = [];

        if (dataFlowModel.checkAllModulesAssigned() === false) {
            this.selectionMetricsCard.updateHeadlineText("Metrics of Selected Module/Data Stream");

            keyValues = [
                {key: "All modules must be assigned to machines before metrics can be calculated.", value: ""}
            ];
        } else {

            if (moduleId !== null) {
                const module = dataFlowModel.modules.get(moduleId);
                this.selectionMetricsCard.updateHeadlineText("(Module) Metrics");

                if (dataFlowModel.checkModuleWithIdIsReached(moduleId)) {
                    keyValues = [
                        {key: "Processing cost: ", value: getProcessingCostForModuleWithIdAsString(moduleId)},
                        {key: "Processing time: ", value: getProcessingTimeForModuleWithIdAsString(moduleId)},
                    ];
                } else {
                    keyValues = [
                        {
                            key: "Module is not reached.",
                            value: ""
                        }
                    ];
                }
            } else if (dataPathId !== null) {
                const dataPath = dataFlowModel.dataPaths.get(dataPathId);
                this.selectionMetricsCard.updateHeadlineText("(Data Stream) Metrics");

                if (dataFlowModel.checkDataPathWithIdIsReached(dataPathId)) {
                    keyValues = [
                        {key: "Transmission cost: ", value: getTransmissionCostForDataPathWithIdAsString(dataPathId)},
                        {key: "Transmission time: ", value: getTransmissionTimeForDataPathWithIdAsString(dataPathId)}
                    ];
                } else {
                    keyValues = [
                        {
                            key: "Data stream is impossible.",
                            value: ""
                        }
                    ];
                }

            } else {
                this.selectionMetricsCard.updateHeadlineText("Flow Metrics of Selected Module/Data Path");

                keyValues = [
                    {key: "Select a module or data stream to get their metrics.", value: ""}
                ];
            }
        }

        const rows = CardManager.generateTableRows(keyValues);
        this.selectionMetricsCard.updateTableContentWithRows(rows);
        this.selectionMetricsCard.showCard();

    }

    updateInfrastructureCard(nodeId, connectionId) {

        let keyValues = [];

        if (nodeId !== undefined) {
            const node = infrastructureModel.nodes.get(nodeId);
            this.infrastructureCard.updateHeadlineText("Machine Information");
            keyValues = [
                // {key: "Id: ", value: node_id(node)},
                // {key: "Name: ", value: node_label(node)},
                {key: "Performance Indicator: ", value: node_performanceIndicator(node) + " pi"},
                {key: "Available Memory: ", value: node_availableMemory(node) + " MB"},
                {key: "Used Memory: ", value: node_usedMemory(node) + " MB"},
                {key: "Memory Price: ", value: node_memoryPrice(node) + " Cent/MB/s"}
            ];

        } else if (connectionId !== undefined) {
            const connection = infrastructureModel.connections.get(connectionId);
            this.infrastructureCard.updateHeadlineText("Connection Information");
            keyValues = [
                // {key: "Id:", value: connection_id(connection)},
                {key: "Latency: ", value: connection_latency(connection) + " s"},
                {key: "Available Bandwidth: ", value: connection_availableBandwidth(connection) + " kB/s"},
                {key: "Used Bandwidth: ", value: connection_usedBandwidth(connection) + " kB/s"},
                {key: "Bandwidth Price: ", value: connection_bandwidthPrice(connection) + " Cent/kB"}
            ];

        } else {
            this.infrastructureCard.updateHeadlineText("Infrastructure Properties");
            keyValues = [
                {key: "Select a node or connection to inspect its properties.", value: ""}
            ];
        }

        const rows = CardManager.generateTableRows(keyValues);
        this.infrastructureCard.updateTableContentWithRows(rows);
        this.infrastructureCard.showCard();
    }

    updateDataflowCard(moduleId, dataPathId) {
        let keyValues = [];

        if (moduleId !== undefined) {
            const module = dataFlowModel.modules.get(moduleId);
            this.dataFlowCard.updateHeadlineText("Module Information");
            keyValues = [
                // {key: "Id:", value: module_id(module)},
                // {key: "Name:", value: module_label(module)},
                {key: "Type:", value: module_type(module)}
            ];

            if (module_type(module) === "sensor") {
                keyValues = keyValues.concat([
                    {key: "Mode (individual/total):", value: module_mode(module)},
                    {key: "Output Rate:", value: module_outputRate(module) + " kB/s"},
                    {key: "Required Memory:", value: module_requiredMemory(module) + "MB"}
                ]);
            } else if (module_type(module) === "service") {
                keyValues = keyValues.concat([
                    {key: "Mode (individual/total):", value: module_mode(module)},
                    {key: "Output Size:", value: module_outputRatio(module)},
                    {key: "Processing Time:", value: module_baseProcessingTime(module) + "s/pi"},
                    {key: "Required Memory:", value: module_requiredMemory(module) + "MB"}
                ]);
            } else if (module_type(module) === "sink") {
                keyValues = keyValues.concat([
                    {key: "Required Memory:", value: module_requiredMemory(module) + "MB"}
                ]);
            }

        } else if (dataPathId !== undefined) {
            const dataPath = dataFlowModel.dataPaths.get(dataPathId);
            this.dataFlowCard.updateHeadlineText("Data Stream Properties");
            keyValues = [
                // {key: "Id:", value: dataPath_id(dataPath)},
                // {key: "From Module:", value: dataPath_from(dataPath)},
                // {key: "To Module:", value: dataPath_to(dataPath)},
                {key: "Required Bandwidth: ", value: dataPath_requiredBandwidth(dataPath) + "MB/s"}
            ];

        } else {
            this.dataFlowCard.updateHeadlineText("Application Properties");
            keyValues = [
                {key: "Select a module or data stream to inspect its properties.", value: ""}
            ];
        }

        const rows = CardManager.generateTableRows(keyValues);
        this.dataFlowCard.updateTableContentWithRows(rows);
        this.dataFlowCard.showCard();
    }

}

class CardManager {

    constructor(tag) {
        this.tag = tag;
        this.card = $(tag);
        this.headline = this.card.find("h5");
        this.table = this.card.find("tbody");
        this.reset();
    }

    reset() {
        this.locked = false; // only allow updates to visualization if not locked
        this.clearAndHide();
    }

    getHeadlineText() {
        return this.headline.text();
    }

    updateHeadlineText(headline) {
        if (this.locked) {
            return false;
        }
        this.headline.text(headline);
    }

    updateTableContentWithRows(rows) {
        if (this.locked) {
            return false;
        }
        this.table.empty();
        const that = this;
        rows.forEach(function (tr) {
            that.table.append(tr);
        })
    }

    static generateTableRows(keyValues) {
        const rows = [];

        for (let i = 0; i < keyValues.length; i++) {
            const tr = document.createElement("tr");
            const tdKey = document.createElement("td");
            tdKey.appendChild(document.createTextNode(keyValues[i].key));
            const tdValue = document.createElement("td");
            tdValue.appendChild(document.createTextNode(keyValues[i].value));
            tr.appendChild(tdKey);
            tr.appendChild(tdValue);
            rows.push(tr);
        }

        return rows;
    }

    showCard() {
        this.card.show();
    }

    /**
     * Clears all information from the current field and hides it.
     */
    clearAndHide() {
        if (this.locked) {
            return false;
        }
        this.headline.text("");
        this.table.empty();
        this.card.hide();
    }

}
