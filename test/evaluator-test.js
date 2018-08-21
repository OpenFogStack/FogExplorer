// MAKE (MEAN) GLOBAL VARIABLES TO SIMULATE BROWSER BEHAVIOR
require("../node/nodeGlobalizer");
// END (MEAN) GLOBAL VARIABLES MAKER

const assert = require("assert");

describe("Evaluator (splitAndMergeExample)", function () {
    const parsedJSON = require('../exampleData/splitAndMergeExample');
    const evaluator = require("../sharedLogic/evaluator");

    it("should have loaded its modules", function () {
        const success = evaluator.loadModels(parsedJSON);
        assert.equal(success, true, "Models have not been loaded correctly.");
    });

    it("should have calculated a coherent flow with the correct metrics.", function () {
        evaluator.setCurrentlySelectedModuleToModuleWithId("sm_1");
        evaluator.assignCurrentlySelectedModuleToNodeWithId("e1");
        evaluator.setCurrentlySelectedModuleToModuleWithId("sm_2");
        evaluator.assignCurrentlySelectedModuleToNodeWithId("e2");
        evaluator.setCurrentlySelectedModuleToModuleWithId("fm");
        evaluator.assignCurrentlySelectedModuleToNodeWithId("c");
        evaluator.setCurrentlySelectedModuleToModuleWithId("am_1");
        evaluator.assignCurrentlySelectedModuleToNodeWithId("e3");
        evaluator.setCurrentlySelectedModuleToModuleWithId("am_2");
        evaluator.assignCurrentlySelectedModuleToNodeWithId("e4");

        evaluator.calculateCoherentFlow();

        assert.equal(evaluator.getTotalProcessingCost(), 104, "Processing cost is not as expected.");
        assert.equal(evaluator.getTotalProcessingTime(), 8, "Processing time is not as expected.");
        assert.equal(evaluator.getTotalTransmissionCost(), 42, "Transmission cost is not as expected.");
        assert.equal(evaluator.getTotalTransmissionTime(), 5, "Transmission time is not as expected.");
    });
});

describe("Evaluator (load assigned splitAndMergeExample", function () {
    const parsedJSON = require('../exampleData/splitAndMergeExample_assigned');
    const evaluator = require("../sharedLogic/evaluator");

    it("should have loaded its modules", function () {
        const success = evaluator.loadModels(parsedJSON);
        assert.equal(success, true, "Models have not been loaded correctly.");
    });

    it("should already have a coherent flow present.", function () {
        assert.equal(evaluator.getTotalProcessingCost(), 104, "Processing cost is not as expected.");
        assert.equal(evaluator.getTotalProcessingTime(), 8, "Processing time is not as expected.");
        assert.equal(evaluator.getTotalTransmissionCost(), 42, "Transmission cost is not as expected.");
        assert.equal(evaluator.getTotalTransmissionTime(), 5, "Transmission time is not as expected.");
    });
});

// TODO: RUN TEST WITH SECOND DATA SETd
// describe("Evaluator (simpleExample)", function () {
//     const parsedJSON = require('../exampleData/simpleExample');
//     const evaluator = require("../sharedLogic/evaluator");
//
//     it("should have loaded its modules", function () {
//         const success = evaluator.loadModels(parsedJSON);
//         assert.equal(success, true, "Models have not been loaded correctly.");
//     });
//
//     it("should have calculated a coherent flow with the correct metrics.", function () {
//         evaluator.setCurrentlySelectedModuleToModuleWithId("sm_1");
//         evaluator.assignCurrentlySelectedModuleToNodeWithId("e1");
//         evaluator.setCurrentlySelectedModuleToModuleWithId("sm_2");
//         evaluator.assignCurrentlySelectedModuleToNodeWithId("e2");
//         evaluator.setCurrentlySelectedModuleToModuleWithId("fm");
//         evaluator.assignCurrentlySelectedModuleToNodeWithId("c");
//         evaluator.setCurrentlySelectedModuleToModuleWithId("am_1");
//         evaluator.assignCurrentlySelectedModuleToNodeWithId("e3");
//         evaluator.setCurrentlySelectedModuleToModuleWithId("am_2");
//         evaluator.assignCurrentlySelectedModuleToNodeWithId("e4");
//
//         evaluator.calculateCoherentFlow();
//
//         assert.equal(evaluator.getTotalProcessingCost(), 100, "Processing cost is not as expected.");
//         assert.equal(evaluator.getTotalProcessingTime(), 8, "Processing time is not as expected.");
//         assert.equal(evaluator.getTotalTransmissionCost(), 42, "Transmission cost is not as expected.");
//         assert.equal(evaluator.getTotalTransmissionTime(), 5, "Transmission time is not as expected.");
//     });
// });
