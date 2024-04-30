const { required } = require("joi");
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    DOB: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    locality: {
      type: String,
      required: true,
    },
    school: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    fieldOfStudy: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    skills: {
      type: Array,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    jobDetails: [
      {
        role: String,
        startDate: String,
        currentlyWorking: Boolean,
        endDate: String,
        employeeType: String,
      },
    ],
    prefferedRole: {
      type: String,
      required: true,
    },
    jobPreferences: {
      type: String,
      required: true,
    },
    CV: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const candidate = mongoose.model("Candidate", candidateSchema, "candidates");

module.exports = candidate;
