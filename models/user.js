const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    DOB: {
      type: String,
    },
    age: {
      type: Number,
    },
    height: {
      type: Number,
    },
    motherTongue: {
      type: String,
    },
    cast: {
      type: String,
    },
    religion: {
      type: String,
    },
    sect: {
      type: String,
    },
    city: {
      type: String,
    },
    highestDegree: {
      type: String,
    },
    occupation: {
      type: String,
    },
    employedIn: {
      type: String,
    },
    annualIncome: {
      type: Number,
    },
    workLocation: {
      type: String,
    },
    maritalStatus: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
    chatedUsers: [
      {
        roomId: String,
        chatedId: String,
      },
    ],
    recentlyViewed: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
      },
    ],
    membership: { type: mongoose.SchemaTypes.Mixed, default: {} },
    userImages: [String],
    partnerPreference: {
      partnerAge: String,
      partnerMaritalStatus: String,
      partnerHeight: String,
      education: String,
      partnerOccupation: String,
      partnerMotherTongue: String,
      partnerAnnualIncome: String,
      partnerSect: String,
      partnerCity: String,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sentInterests: [String],
    receivedInterests: [String],
    friends: [String],
  },

  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema, "users");

module.exports = user;
