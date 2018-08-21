class InfrastructureView {

    constructor() {
        this.reset();
    }

    reset() {
        this.network = undefined;
    }

    /**
     * Draws the infrastructure network graph.
     * NOTE: Updating the original nodes/connections object will also update the graph.
     *
     * @param nodes - a vis dataset describing the infrastructure's nodes
     * @param connections - a vis dataset describing the connections between nodes
     */
    drawGraph(nodes, connections) {
        this.reset();

        const container = document.getElementById("infrastructureNetwork_vis");

        // set initial image of each node
        nodes.forEach(function (node) {
            node["image"] = InfrastructureView.buildNodeSVGImage();
            nodes.update(node);
        });

        const data = {
            nodes: nodes,
            edges: connections
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
                    color: "#000000"
                },
                length: 300
            },
            interaction: {
                hover: false,
                selectConnectedEdges: false
            },
            manipulation: {
                enabled: false
            },
            layout: {
                // randomSeed: 11235813
            },
            physics: {
                enabled: true,
                solver: "forceAtlas2Based"
            }
        };

        this.network = new vis.Network(container, data, options);
    }

    /**
     * Creates an image for a node based on the given parameters.
     *
     * @param moduleColorArray - array that holds the colors of all modules assigned to the node,
     * can be undefined for standard color
     * @param missesMemory - if true, "Missing Memory" is written inside the node
     */
    static buildNodeSVGImage(moduleColorArray, missesMemory) {
        if (typeof moduleColorArray === "undefined") {
            let color = "#8DB5BA";

            let svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="40">
                    <rect x="0" y="0" width="100%" height="100%" fill="${color}"></rect>
                </svg>`;
            return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        }

        // an array is given, so we have to visualize the Modules' color
        let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40">';

        // The width (in percent) of each further rectangle must be increased by the number below
        const widthDecrease = 100 / moduleColorArray.length;
        let nextWidth = 100;

        moduleColorArray.forEach(function (moduleColor) {
            const currentWidth = nextWidth;

            svg += `<rect x="0" y="0" width="${currentWidth}%" height="100%" fill="${moduleColor}"></rect>`;

            nextWidth = currentWidth - widthDecrease;
        });

        if (missesMemory) {
            svg += '<text x="50%" y="50%" font-size="60%" ' +
                'alignment-baseline="middle" text-anchor="middle">Memory Missing</text>';

        }

        svg += "</svg>";
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }

}
