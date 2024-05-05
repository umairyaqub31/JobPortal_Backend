const express = require("express");
const app = express();

const multer = require("multer");
const fs = require("fs");
const admin = require("firebase-admin");
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     storageBucket: "meditour-33ba8.appspot.com", // Replace with your actual storage bucket URL
//   });
const { firebase } = require("../firebase/");

const bucket = firebase.storage().bucket();

const uploadFileController = {
  async uploadFile(req, res) {
    console.log("hitttt......", req.file);
    try {
      if (req.file) {
        const file = fs.readFileSync(req.file.path);
        const imageRef = bucket.file(
          `profile_pictures/${req.file.originalname}`
        );

        bucket
          .upload(req.file.path, {
            destination: imageRef,
            metadata: {
              contentType: req.file.mimetype,
            },
          })
          .then(() => {
            // Delete the local file after uploading
            fs.unlinkSync(req.file.path);

            // Get the public URL of the uploaded image
            imageRef
              .getSignedUrl({
                action: "read",
                expires: "01-01-3000", // Set an expiration date if needed
              })
              .then((signedUrls) => {
                const imageUrl = signedUrls[0];
                return res.status(200).json({
                  fileUrl: imageUrl,
                });
                // })
              })
              .catch((error) => {
                console.error("Error getting signed URL:", error);
                return res.status(500).send("Error getting signed URL.");
              });
          })
          .catch((error) => {
            console.error("Error uploading image:", error);
            return res.status(500).send("Error uploading image.");
          });
      } else {
        return res.status(404).json({
          status: false,
          message: "Please select an image",
        });
      }
    } catch (error) {
      res.status(500).json({
        status: "Failure",
        error: error.message,
      });
    }
  },
};

module.exports = uploadFileController;
