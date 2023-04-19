import * as firebaseFunctionsTest from "firebase-functions-test";
import { updateCardProgress } from "./functions/lib/index";

// Initialize the test SDK with your project config
const test = firebaseFunctionsTest(
  {
    projectId: "fraiseappbeta",
  },
  "/Users/jackalba/Documents/Phraseapp/serviceAccountKey.json" // Path to your service account key file
);

// Prepare test data
const testData = {
  userId: "userId",
  cardId: "cardId",
  performanceRating: 3,
};

// Call the function with test data
const wrappedFunction = test.wrap(updateCardProgress);
wrappedFunction(testData, {}).then((result) => {
  console.log("Function call successful:", result);
  test.cleanup();
}).catch((error) => {
  console.error("Function call failed:", error);
  test.cleanup();
});
