let moduleController;
let infrastructureController;
let informationCardController;

$(document).ready(function () {

    start({
            "nodes": [
                {
                    "id": "temo_w",
                    "label": "10x Temperature Edge Machine (Outside)",
                    "baseProperties": {
                        "availableMemory": 40,
                        "memoryPrice": 3.9e-06,
                        "performanceIndicator": 0.2
                    }
                },
                {
                    "id": "temi_w",
                    "label": "6x Temperature Edge Machine (Inside)",
                    "baseProperties": {
                        "availableMemory": 24,
                        "memoryPrice": 3.9e-06,
                        "performanceIndicator": 0.2
                    }
                },
                {
                    "id": "aem_w",
                    "label": "13x Airing Edge Machines",
                    "baseProperties": {
                        "availableMemory": 52,
                        "memoryPrice": 3.9e-06,
                        "performanceIndicator": 0.2
                    }
                },
                {
                    "id": "acem_w",
                    "label": "10x Air Conditioning Edge Machine",
                    "baseProperties": {
                        "availableMemory": 40,
                        "memoryPrice": 3.9e-06,
                        "performanceIndicator": 0.2
                    }
                },
                {
                    "id": "s",
                    "label": "Server",
                    "baseProperties": {
                        "availableMemory": 10000,
                        "memoryPrice": 1.9e-08,
                        "performanceIndicator": 4
                    }
                }
            ],
            "connections": [
                {
                    "from": "temi_w",
                    "to": "s",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                },
                {
                    "from": "s",
                    "to": "temi_w",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                },
                {
                    "from": "temo_w",
                    "to": "s",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                },
                {
                    "from": "s",
                    "to": "temo_w",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                },
                {
                    "from": "acem_w",
                    "to": "s",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                },
                {
                    "from": "s",
                    "to": "acem_w",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                },
                {
                    "from": "aem_w",
                    "to": "s",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                },
                {
                    "from": "s",
                    "to": "aem_w",
                    "baseProperties": {
                        "availableBandwidth": 2,
                        "bandwidthPrice": 0.01,
                        "latency": 1
                    }
                }
            ],
            "modules": [
                {
                    "id": "ots",
                    "label": "10x Outdoor Temperature Sensor",
                    "type": "sensor",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRate": 2,
                        "requiredMemory": 20
                    }
                },
                {
                    "id": "its",
                    "label": "6x Indoor Temperature Sensor",
                    "type": "sensor",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRate": 1.2,
                        "requiredMemory": 12
                    }
                },
                {
                    "id": "ws",
                    "label": "13x Window Sensor",
                    "type": "sensor",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRate": 1.3,
                        "requiredMemory": 26
                    }
                },
                {
                    "id": "acs",
                    "label": "10x Air Conditioning Sensor",
                    "type": "sensor",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRate": 1,
                        "requiredMemory": 20
                    }
                },
                {
                    "id": "ed_ots",
                    "label": "10x ED",
                    "type": "service",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRatio": 0.1,
                        "referenceProcessingTime": 0.5,
                        "requiredMemory": 2000
                    }
                },
                {
                    "id": "ed_its",
                    "label": "6x ED",
                    "type": "service",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRatio": 0.1,
                        "referenceProcessingTime": 0.5,
                        "requiredMemory": 1200
                    }
                },
                {
                    "id": "ed_ws",
                    "label": "13x ED",
                    "type": "service",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRatio": 0.01,
                        "referenceProcessingTime": 0.2,
                        "requiredMemory": 2600
                    }
                },
                {
                    "id": "ed_acs",
                    "label": "10x ED",
                    "type": "service",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRatio": 0.01,
                        "referenceProcessingTime": 0.2,
                        "requiredMemory": 2000
                    }
                },
                {
                    "id": "al",
                    "label": "Airing Logic",
                    "type": "service",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRatio": 0.1,
                        "referenceProcessingTime": 1,
                        "requiredMemory": 500
                    }
                },
                {
                    "id": "acl",
                    "label": "Air Conditioning Logic",
                    "type": "service",
                    "baseProperties": {
                        "mode": "individual",
                        "outputRatio": 0.1,
                        "referenceProcessingTime": 1,
                        "requiredMemory": 500
                    }
                },
                {
                    "id": "wa",
                    "label": "Window Actuator",
                    "type": "sink",
                    "baseProperties": {
                        "requiredMemory": 26
                    }
                },
                {
                    "id": "aca",
                    "label": "Air Conditioning Actuator",
                    "type": "sink",
                    "baseProperties": {
                        "requiredMemory": 20
                    }
                }
            ],
            "dataPaths": [
                {
                    "from": "acs",
                    "to": "ed_acs"
                },
                {
                    "from": "its",
                    "to": "ed_its"
                },
                {
                    "from": "ots",
                    "to": "ed_ots"
                },
                {
                    "from": "ws",
                    "to": "ed_ws"
                },
                {
                    "from": "ed_acs",
                    "to": "acl"
                },
                {
                    "from": "ed_its",
                    "to": "acl"
                },
                {
                    "from": "ed_its",
                    "to": "al"
                },
                {
                    "from": "ed_ots",
                    "to": "al"
                },
                {
                    "from": "ed_ws",
                    "to": "al"
                },
                {
                    "from": "acl",
                    "to": "aca"
                },
                {
                    "from": "al",
                    "to": "wa"
                },
                {
                    "from": "al",
                    "to": "acl"
                }
            ],
            "placements": {
                "acs": "acem_w",
                "aca": "acem_w",
                "its": "temi_w",
                "ws": "aem_w",
                "ots": "temo_w",
                "wa": "aem_w",
                "ed_acs": "s",
                "ed_ots": "s",
                "ed_ws": "s",
                "ed_its": "s",
                "acl": "s",
                "al": "s"
            }
        }
    );
});

Split(['#infrastructureNetwork', '#moduleNetwork'], {
    direction: 'vertical',
    sizes: [50, 50]
});

$(document).foundation();
// open modal
$("#tutorialModal").foundation("open");

function start(json) {

    loadModels(json);

    // then the controller (which also build the views)
    informationCardController = new InformationCardController();

    infrastructureController = new InfrastructureController();

    moduleController = new DataFlowController();

    // set initial view
    informationCardController.updateFlowMetricsCard();
    informationCardController.updateFlowSelectionMetricsCard(null, null);
    informationCardController.updateInfrastructureCard(undefined, undefined);
    informationCardController.updateDataflowCard(undefined, undefined);

    $("#downloadButton").click(function () {
        const json = getAllDataRepresentation();
        const data = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);

        $(this).attr({'href': data, 'target': '_blank'});
    });

    $("#weak").click(function () {
        location.reload();
    });

    $("#strong").click(function () {
        start({
                "nodes": [
                    {
                        "id": "temo_s",
                        "label": "10x Temperature Edge Machines (Outside)",
                        "baseProperties": {
                            "availableMemory": 10000,
                            "memoryPrice": 1.9e-08,
                            "performanceIndicator": 1
                        }
                    },
                    {
                        "id": "temi_s",
                        "label": "6x Temperature Edge Machines (Inside)",
                        "baseProperties": {
                            "availableMemory": 6000,
                            "memoryPrice": 1.9e-08,
                            "performanceIndicator": 1
                        }
                    },
                    {
                        "id": "aem_s",
                        "label": "13x Airing Edge Machines",
                        "baseProperties": {
                            "availableMemory": 13000,
                            "memoryPrice": 1.9e-08,
                            "performanceIndicator": 0.2
                        }
                    },
                    {
                        "id": "acem_s",
                        "label": "10x Air Conditioning Edge Machines",
                        "baseProperties": {
                            "availableMemory": 10000,
                            "memoryPrice": 1.9e-08,
                            "performanceIndicator": 1
                        }
                    }
                ],
                "connections": [
                    {
                        "from": "temi_s",
                        "to": "temo_s",
                        "baseProperties": {
                            "availableBandwidth": 500,
                            "bandwidthPrice": 0.0001,
                            "latency": 0.001
                        }
                    },
                    {
                        "from": "temo_s",
                        "to": "temi_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "temi_s",
                        "to": "acem_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "acem_s",
                        "to": "temi_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "temi_s",
                        "to": "aem_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "aem_s",
                        "to": "temi_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "acem_s",
                        "to": "temo_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "temo_s",
                        "to": "acem_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "acem_s",
                        "to": "aem_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "aem_s",
                        "to": "acem_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "temo_s",
                        "to": "aem_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    },
                    {
                        "from": "aem_s",
                        "to": "temo_s",
                        "baseProperties": {
                            "availableBandwidth": 2,
                            "bandwidthPrice": 0.01,
                            "latency": 1
                        }
                    }
                ],
                "modules": [
                    {
                        "id": "ots",
                        "label": "10x Outdoor Temperature Sensor",
                        "type": "sensor",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRate": 2,
                            "requiredMemory": 20
                        }
                    },
                    {
                        "id": "its",
                        "label": "6x Indoor Temperature Sensor",
                        "type": "sensor",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRate": 1.2,
                            "requiredMemory": 12
                        }
                    },
                    {
                        "id": "ws",
                        "label": "13x Window Sensor",
                        "type": "sensor",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRate": 1.3,
                            "requiredMemory": 26
                        }
                    },
                    {
                        "id": "acs",
                        "label": "10x Air Conditioning Sensor",
                        "type": "sensor",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRate": 1,
                            "requiredMemory": 20
                        }
                    },
                    {
                        "id": "ed_ots",
                        "label": "10x ED",
                        "type": "service",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRatio": 0.1,
                            "referenceProcessingTime": 0.5,
                            "requiredMemory": 2000
                        }
                    },
                    {
                        "id": "ed_its",
                        "label": "6x ED",
                        "type": "service",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRatio": 0.1,
                            "referenceProcessingTime": 0.5,
                            "requiredMemory": 1200
                        }
                    },
                    {
                        "id": "ed_ws",
                        "label": "13x ED",
                        "type": "service",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRatio": 0.01,
                            "referenceProcessingTime": 0.2,
                            "requiredMemory": 2600
                        }
                    },
                    {
                        "id": "ed_acs",
                        "label": "10x ED",
                        "type": "service",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRatio": 0.01,
                            "referenceProcessingTime": 0.2,
                            "requiredMemory": 2000
                        }
                    },
                    {
                        "id": "al",
                        "label": "Airing Logic",
                        "type": "service",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRatio": 0.1,
                            "referenceProcessingTime": 1,
                            "requiredMemory": 500
                        }
                    },
                    {
                        "id": "acl",
                        "label": "Air Conditioning Logic",
                        "type": "service",
                        "baseProperties": {
                            "mode": "individual",
                            "outputRatio": 0.1,
                            "referenceProcessingTime": 1,
                            "requiredMemory": 500
                        }
                    },
                    {
                        "id": "wa",
                        "label": "Window Actuator",
                        "type": "sink",
                        "baseProperties": {
                            "requiredMemory": 26
                        }
                    },
                    {
                        "id": "aca",
                        "label": "Air Conditioning Actuator",
                        "type": "sink",
                        "baseProperties": {
                            "requiredMemory": 20
                        }
                    }
                ],
                "dataPaths": [
                    {
                        "from": "acs",
                        "to": "ed_acs"
                    },
                    {
                        "from": "its",
                        "to": "ed_its"
                    },
                    {
                        "from": "ots",
                        "to": "ed_ots"
                    },
                    {
                        "from": "ws",
                        "to": "ed_ws"
                    },
                    {
                        "from": "ed_acs",
                        "to": "acl"
                    },
                    {
                        "from": "ed_its",
                        "to": "acl"
                    },
                    {
                        "from": "ed_its",
                        "to": "al"
                    },
                    {
                        "from": "ed_ots",
                        "to": "al"
                    },
                    {
                        "from": "ed_ws",
                        "to": "al"
                    },
                    {
                        "from": "acl",
                        "to": "aca"
                    },
                    {
                        "from": "al",
                        "to": "wa"
                    },
                    {
                        "from": "al",
                        "to": "acl"
                    }
                ],
                "placements": {
                    "acs": "acem_s",
                    "ed_acs": "acem_s",
                    "acl": "acem_s",
                    "aca": "acem_s",
                    "ws": "aem_s",
                    "ed_ws": "aem_s",
                    "al": "aem_s",
                    "wa": "aem_s",
                    "ots": "temo_s",
                    "ed_ots": "temo_s",
                    "its": "temi_s",
                    "ed_its": "temi_s"
                }
            }
        )
    });

    // it is possible that assignments already exist, so let's recalculate all coloring
    infrastructureModel.nodes.forEach(function (node) {
        InfrastructureController.updateNodeImageWithColors(node_id(node),
            dataFlowModel.getColorsForNodeWithId(node_id(node)));
    });

    // it is possible that a coherent flow already exists
    InfrastructureController.tryToHighlightCoherentFlow();
    informationCardController.updateFlowMetricsCard();
}

function loadJSON(path, success, error) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                success(JSON.parse(xhr.responseText));
            } else {
                error(xhr);
            }
        }
    };
    xhr.open('GET', path, true);
    xhr.send();
}

/**
 * File Upload
 */

function handleUpload(files) {
    if (window.FileReader) {
        processFile(files[0]);
    } else {
        alert('FileReader is not supported in this browser :/.');
    }
}

function processFile(fileToRead) {
    const reader = new FileReader();
    // setup handler
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
    // start processing
    reader.readAsText(fileToRead);
}

function loadHandler(event) {
    const json = event.target.result;
    start(JSON.parse(json));
}

function errorHandler(event) {
    alert("Error loading file!");
    console.log(String(event));
}

