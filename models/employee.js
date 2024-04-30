const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },

    // fcmToken: {
    //   type: String,
    // },

    company: {
      companyType: String,
      name: String,
      workingAs: String,
      email: String,
      webUrl: String,
      about: String,
      size: String,
      city: String,
      locality: String,
      // logo: String,
    },
  },

  {
    timestamps: true,
  }
);

const employee = mongoose.model("Employee", employeeSchema, "employees");

module.exports = employee;
