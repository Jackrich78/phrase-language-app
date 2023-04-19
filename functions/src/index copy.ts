import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

interface setData {
  category: string;
  setName: string;
  img: string;
  ref: string;
}
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
export const getColoursSetUpdate =
functions.firestore.document("/Sets//Sets/2qeFWxuPZiCNsuGfuFg7")
  .onUpdate((change) => {
    const after = change.after.data() as setData;
    const payload = {
      data: {
        category: after.category,
        setName: after.setName,
        img: after.img,
        ref: after.ref,
        // temp: String(after.temp),
      },
    };
    return admin.messaging().sendToTopic("sets_colours", payload);
  });

export const getColoursSet = functions.https.onRequest((request, response) => {
  const promise = admin.firestore().doc("/Sets/2qeFWxuPZiCNsuGfuFg7").get();
  const p2 = promise.then((snapshot) => {
    const data = snapshot.data() as setData;
    response.send(data);
  });
  p2.catch((error) => {
    // handle the error
    console.log("error of colour set");
    response.status(500).send(error);
  });
  // functions.logger.info("Hello logs!", {structuredData: true});
  // console.log("test for colour set")
  // response.send("Hello from Firebase 9th March!");
})
;
