const firebase = require("firebase-admin");
const serviceAccount = require("../hireon-832cc-firebase-adminsdk-d4kuy-e8d345b99d.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  storageBucket: "gs://hireon-832cc.appspot.com", // Replace with your actual storage bucket URL/
});

module.exports = { firebase };
