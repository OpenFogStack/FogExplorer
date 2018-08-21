// MAKE (MEAN) GLOBAL VARIABLES TO SIMULATE BROWSER BEHAVIOR
require("./nodeGlobalizer");
// END (MEAN) GLOBAL VARIABLES MAKER

const evaluator = require("../sharedLogic/evaluator");

console.log("Evaluator loaded");
const parsedJSON = require('../exampleData/splitAndMergeExample');
evaluator.loadModels(parsedJSON);

console.log("Loaded JSON");

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
console.log("Total Processing Time: " + evaluator.getTotalProcessingTimeAsString());
console.log("Total Processing Cost: " + evaluator.getTotalProcessingCostAsString());
console.log("Total Transmission Time: " + evaluator.getTotalTransmissionTimeAsString());
console.log("Total Transmission Cost: " + evaluator.getTotalTransmissionCostAsString());

console.log(evaluator.getAllDataRepresentation());
