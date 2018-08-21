class DataFlowView {

    constructor() {
        this.reset();
    }

    reset() {
        this.network = undefined;
    }

    /**
     * Draws the module network graph.
     * NOTE: Updating the original modules/datapaths object will also update the graph.
     *
     * @param modules - a vis dataset describing the modules
     * @param dataPaths - a vis dataset describing the paths between modules
     */
    drawGraph(modules, dataPaths) {
        this.reset();

        const container = document.getElementById("moduleNetwork_vis");

        const data = {
            nodes: modules,
            edges: dataPaths
        };

        const options = {
            edges: {
                arrows: {
                    to: {
                        enabled: true
                    }
                },
                arrowStrikethrough: false,
                smooth: {
                    enabled: true,
                    type: "dynamic"
                },
                color: {
                    color: "#000000",
                    highlight: "#fd1d11"
                },
                length: 140,
                width: 3
            },
            nodes: {
                borderWidth: 3
            },
            interaction: {
                hover: false,
                selectConnectedEdges: false
            },
            manipulation: {
                enabled: false
            },
            // layout: {
            //     // randomSeed: 11235813
            //     hierarchical: {
            //         direction: "LR"
            //     }
            // },
            physics: {
                enabled: true,
                solver: "forceAtlas2Based"
            }
        };

        this.network = new vis.Network(container, data, options);
    }

}
