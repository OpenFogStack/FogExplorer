let moduleController;
let infrastructureController;
let informationCardController;

// Load JSON
loadJSON("../exampleData/splitAndMergeExample.json", start, function (err) {
    console.log(err);
});

Split(['#infrastructureNetwork', '#moduleNetwork'], {
    direction: 'vertical',
    sizes: [50, 50]
});

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

