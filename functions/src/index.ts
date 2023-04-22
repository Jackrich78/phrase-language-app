import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// import * as dotenv from "dotenv";
// import * as fs from "fs";
import {Timestamp} from "firebase-admin/firestore";

// dotenv.config({path: "./../.env"});

try {
  exports.test = functions.region("europe-west1")
    .https.onRequest( async (req, res) => {
      res.send("hello world");
    });

  exports.updateCardProgressV2 = functions.
    region("europe-west1").
    https.onRequest( async (req, res) => {
      // const serviceAccountKeyJson: string =
      // fs.readFileSync("./serviceAccountKey.json",
      //   "utf8");

      // console.log("process.env.PRIVATE_KEY", process.env.PRIVATE_KEY);

      // const replacedServiceAccountKey = serviceAccountKeyJson
      //   .replace("${process.env.PRIVATE_KEY_ID}",
      //     process.env.PRIVATE_KEY_ID as string)
      //   .replace("${process.env.PRIVATE_KEY}",
      //     (process.env.PRIVATE_KEY as string));

      // console.log("replacedServiceAccountKey", replacedServiceAccountKey);
      // const serviceAccountKey: admin.ServiceAccount = JSON.parse(
      //   replacedServiceAccountKey
      // ) as admin.ServiceAccount;

      // console.log(serviceAccountKey);

      // admin.initializeApp({
      //   credential: admin.credential.cert(serviceAccountKey),
      // });
      admin.initializeApp();

      const db = admin.firestore();

      console.log("Request body", req.body);
      functions.logger.log(
        "Function called at:",
        Timestamp.now().toDate()
      );

      const {userId, cardId, performanceRating} = req.body;

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
          nextReviewDate: Timestamp.now(),
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
          const newNextReviewDate = Timestamp.fromMillis(
            Timestamp.now().toMillis() +
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

      res.json({message: "UserCard progress updated successfully"});
    });
} catch (e) {
  console.error(e);
}

