import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();
const serviceAccountKeyJson: string =
  fs.readFileSync("/Users/jackalba/Documents/Phraseapp/serviceAccountKey.json",
    "utf8");
const serviceAccountKey: admin.ServiceAccount = JSON.parse(
  serviceAccountKeyJson
    .replace("${process.env.PRIVATE_KEY_ID}",
      process.env.PRIVATE_KEY_ID as string)
    .replace("${process.env.PRIVATE_KEY}",
      (process.env.PRIVATE_KEY as string).replace(/\\n/g, "\n"))
) as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

const db = admin.firestore();

exports.updateCardProgress = functions.
  region("europe-west1").
  https.onCall(async (data) => {
    functions.logger.log(
      "Function called at:",
      admin.firestore.Timestamp.now().toDate()
    );

    const {userId, cardId, performanceRating} = data;

    console.log("Extracted data:", {userId, cardId, performanceRating});

    // Check if all necessary data is present
    if (!userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Request body is missing userId."
      );
    }
    if (!cardId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Request body is missing cardId."
      );
    }
    if (performanceRating === undefined || performanceRating === null) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Request body is missing performanceRating."
      );
    }

    // TO ADD authentication check by sending ID token

    const userCardRef = db.collection("UserCards").doc(`${userId}_${cardId}`);
    const userCardSnapshot = await userCardRef.get();

    if (!userCardSnapshot.exists) {
      functions.logger.log("UserCard does not exist, creating a new one.");

      await userCardRef.set({
        userId: userId,
        cardId: cardId,
        easinessFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: admin.firestore.Timestamp.now(),
      });
    } else {
      const userCardData = userCardSnapshot.data();

      if (userCardData) {
        functions.logger.log("Updating existing UserCard:", userCardData);

        const oldEF = userCardData.easinessFactor;
        const newEF = Math.max(1.3, oldEF + (0.1 - (5 - performanceRating) *
        (0.08 + (5 - performanceRating) * 0.02)));

        const newRepetitions = userCardData.repetitions + 1;
        const newInterval = newRepetitions === 1 ? 1 : (newRepetitions ===
          2 ? 6 : Math.round(userCardData.interval * newEF));
        const newNextReviewDate = admin.firestore.Timestamp.fromMillis(
          admin.firestore.Timestamp.now().toMillis() +
          newInterval * 24 * 60 * 60 * 1000
        );

        await userCardRef.update({
          easinessFactor: newEF,
          repetitions: newRepetitions,
          interval: newInterval,
          nextReviewDate: newNextReviewDate,
        });
      } else {
        functions.logger.warn("UserCard data is undefined.");
      }
    }

    functions.logger.log("UserCard progress updated successfully");
    return {message: "UserCard progress updated successfully"};
  });
