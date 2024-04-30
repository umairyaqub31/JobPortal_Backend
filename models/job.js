const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    jobOpenings: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    jobBenifit: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    workingDays: {
      type: String,
      required: true,
    },
    shift: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    jobArea: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

const job = mongoose.model("Job", jobSchema, "jobs");

module.exports = job;
