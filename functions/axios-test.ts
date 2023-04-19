import axios from "axios";

const testData = {
  userId: "userId",
  cardId: "cardId",
  performanceRating: 3,
};

axios
  .post("http://localhost:5001/your-project-id/europe-west1-updateCardProgress", testData, {
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then((response) => {
    console.log("Function call successful:", response.data);
  })
  .catch((error) => {
    console.error("Function call failed:", error);
  });
