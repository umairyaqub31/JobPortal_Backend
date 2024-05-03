const express = require("express");
const app = express();
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const User = require("../models/user.js");
const Candidate = require("../models/candidate.js");
const Employee = require("../models/employee.js");
const Job = require("../models/job.js");
const JWTService = require("../services/JWTService.js");
const RefreshToken = require("../models/token.js");
const AccessToken = require("../models/accessToken.js");
const employee = require("../models/employee.js");

const candidateController = {
  async register(req, res, next) {
    const candidateSchema = Joi.object({
      phone: Joi.string().required(),
      fullName: Joi.string().required(),
      gender: Joi.string().required(),
      email: Joi.string().required(),
      DOB: Joi.string().required(),
      city: Joi.string().required(),
      locality: Joi.string().required(),
      school: Joi.string().required(),
      degree: Joi.string().required(),
      grade: Joi.string().required(),
      fieldOfStudy: Joi.string().required(),
      startDate: Joi.string().required(),
      endDate: Joi.string().required(),
      experienceLevel: Joi.string().required(),
      skills: Joi.array().items(Joi.string()).required(),
      experience: Joi.string().required(),
      jobDetails: Joi.array()
        .items(
          Joi.object({
            jobRole: Joi.string(),
            jobStartingMonth: Joi.string(),
            jobStartingYear: Joi.string(),
            currentlyWorking: Joi.boolean(),
            jobEndingYear: Joi.string(),
            jobEndingMonth: Joi.string(),
            employeeType: Joi.string(),
          })
        )
        .required(),
      prefferedRole: Joi.string().required(),
      jobPreferences: Joi.string().required(),
      CV: Joi.string().required(),
      // profilePicture: Joi.string().required(),
      // about: Joi.string().required(),
      // age: Joi.string().required(),
      // languages: Joi.array().items(Joi.string()).required(),
    });

    const { error } = candidateSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const {
      phone,
      fullName,
      gender,
      email,
      DOB,
      city,
      locality,
      school,
      degree,
      grade,
      fieldOfStudy,
      startDate,
      endDate,
      experienceLevel,
      skills,
      experience,
      jobDetails,
      prefferedRole,
      jobPreferences,
      CV,
      // profilePicture,
      // about,
      // age,
      // languages,
    } = req.body;

    let accessToken;
    let refreshToken;

    let candidate;
    try {
      const candidateToRegister = new Candidate({
        phone,
        fullName,
        gender,
        email,
        DOB,
        city,
        locality,
        school,
        degree,
        grade,
        fieldOfStudy,
        startDate,
        endDate,
        experienceLevel,
        skills,
        experience,
        jobDetails,
        prefferedRole,
        jobPreferences,
        CV,
        // profilePicture,
        // about,
        // age,
        // languages,
      });

      candidate = await candidateToRegister.save();
      console.log("ccc...", candidate);
      // token generation
      accessToken = JWTService.signAccessToken({ _id: candidate._id }, "365d");

      refreshToken = JWTService.signRefreshToken(
        { _id: candidate._id },
        "365d"
      );
    } catch (error) {
      return next(error);
    }

    // store refresh token in db
    await JWTService.storeRefreshToken(refreshToken, candidate._id);
    await JWTService.storeAccessToken(accessToken, candidate._id);

    // 6. response send

    // const userDto = new usertorDto(user);

    return res
      .status(201)
      .json({ user: candidate, auth: true, token: accessToken });
  },
  //.......................................Login..................................//

  async login(req, res, next) {
    console.log("chalaa");
    const candidateLoginSchema = Joi.object({
      phone: Joi.string().required(),
    });
    const { error } = candidateLoginSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { phone } = req.body;

    let candidate;

    try {
      // match username
      candidate = await Candidate.findOne({ phone: phone });

      if (candidate == null) {
        const error = {
          status: 401,
          message: "user not found",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }

    const accessToken = JWTService.signAccessToken(
      { _id: candidate._id },
      "365d"
    );
    const refreshToken = JWTService.signRefreshToken(
      { _id: candidate._id },
      "365d"
    );
    // update refresh token in database
    try {
      await RefreshToken.updateOne(
        {
          userId: candidate._id,
        },
        { token: refreshToken },
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }

    try {
      await AccessToken.updateOne(
        {
          userId: candidate._id,
        },
        { token: accessToken },
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }

    return res
      .status(200)
      .json({ user: candidate, auth: true, token: accessToken });
  },

  //.......................................Logout..................................//

  async logout(req, res, next) {
    const userId = req.user._id;
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    try {
      await RefreshToken.deleteOne({ userId });
    } catch (error) {
      return next(error);
    }
    try {
      await AccessToken.deleteOne({ token: accessToken });
    } catch (error) {
      return next(error);
    }

    // 2. response
    res.status(200).json({ user: null, auth: false });
  },

  async getTopCompanies(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
      const companiesPerPage = 10;
      let totalEmployees = await Employee.aggregate([
        {
          $lookup: {
            from: "jobs", // Name of the jobs collection
            localField: "_id", // Field from the employee collection
            foreignField: "employeeId", // Field from the jobs collection
            as: "jobsData", // Alias for the joined data
          },
        },
        {
          $match: {
            jobsData: { $ne: [] }, // Filter to include only documents with at least one match in jobsData
          },
        },
      ]);
      totalEmployees = totalEmployees.length;
      console.log(totalEmployees);
      // Get the total number of posts for the user
      const totalPages = Math.ceil(totalEmployees / companiesPerPage); // Calculate the total number of pages

      const skip = (page - 1) * companiesPerPage;
      const employees = await Employee.aggregate([
        {
          $lookup: {
            from: "jobs", // Name of the jobs collection
            localField: "_id", // Field from the employee collection
            foreignField: "employeeId", // Field from the jobs collection
            as: "jobsData", // Alias for the joined data
          },
        },
        {
          $match: {
            jobsData: { $ne: [] }, // Filter to include only documents with at least one match in jobsData
          },
        },
      ])
        .skip(skip)
        .limit(companiesPerPage);
      const companies = employees.map((employee) => {
        return employee.company;
      });
      return res.status(200).json({
        companies: companies,
        totalCompaniesCount: totalEmployees,
        auth: true,
      });
    } catch (error) {
      next(error);
    }
  },
  async getJobRoles(req, res, next) {
    try {
      // Aggregate query to count documents with the same jobRole
      const jobRoleCounts = await Job.aggregate([
        {
          $group: {
            _id: "$jobRole", // Group by jobRole
            count: { $sum: 1 }, // Count the documents for each jobRole
          },
        },
        {
          $sort: { count: -1 } // Sort by count in descending order
        }
      ]);
      console.log(jobRoleCounts);

      // Map the results to extract jobRole and count
      const result = jobRoleCounts.map((jobRoleCount) => ({
        jobRole: jobRoleCount._id,
        count: jobRoleCount.count,
      }));

      // Return the result
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async searchJobs(req, res, next) {
    try {
      let query = {};

      // Check if jobTitle parameter is provided
      if (req.query.jobTitle) {
        query.jobTitle = { $regex: req.query.jobTitle, $options: "i" };
      }

      // Check if companyName parameter is provided
      let employeeQuery = {};
      if (req.query.companyName) {
        // Apply partial search using case-insensitive regex
        employeeQuery["company.name"] = {
          $regex: req.query.companyName,
          $options: "i",
        };
      }

      // Find employee documents matching the query
      const employees = await Employee.find(employeeQuery);

      // If no employees found, return empty result
      if (!employees || employees.length === 0) {
        return res.json([]);
      }

      // Extract employeeIds from the found employees
      const employeeIds = employees.map((employee) => employee._id);
      console.log(employeeIds);

      // Use the extracted employeeIds to filter jobs
      query.employeeId = { $in: employeeIds };

      // Find jobs matching the updated query
      const jobs = await Job.find(query);

      // Return the found jobs
      return res.json(jobs);
    } catch (error) {
      // Handle errors
      console.error("Error searching for jobs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = candidateController;
