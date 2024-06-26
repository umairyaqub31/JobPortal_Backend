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
            role: Joi.string(),
            startDate: Joi.string(),
            currentlyWorking: Joi.boolean(),
            endDate: Joi.string(),
            employeeType: Joi.string(),
          })
        )
        .required(),
      prefferedRole: Joi.string().required(),
      jobPreferences: Joi.string().required(),
      CV: Joi.string().required(),
      profilePicture: Joi.string().required(),
      about: Joi.string().required(),
      age: Joi.string().required(),
      languages: Joi.array().items(Joi.string()).required(),
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
      profilePicture,
      about,
      age,
      languages,
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
        profilePicture,
        about,
        age,
        languages,
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
      // const companies = employees.map((employee) => {
      //   return employee.company;
      // });
      return res.status(200).json({
        companies: employees,
        totalCompaniesCount: totalEmployees,
        auth: true,
      });
    } catch (error) {
      next(error);
    }
  },
  async getCompanyJobs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
      const jobsPerPage = 10;
      // const vendorId = req.user._id;
      const companyId = req.query.companyId;
      const totalJobs = await Job.countDocuments({ employeeId: companyId }); // Get the total number of posts for the user
      const totalPages = Math.ceil(totalJobs / jobsPerPage); // Calculate the total number of pages

      const skip = (page - 1) * jobsPerPage; // Calculate the number of posts to skip based on the current page

      const allJobs = await Job.find({
        employeeId: companyId,
      })
        .skip(skip)
        .limit(jobsPerPage);
      let previousPage = page > 1 ? page - 1 : null;
      let nextPage = page < totalPages ? page + 1 : null;

      return res.status(200).json({
        jobs: allJobs,
        auth: true,
        totalJobs,
        previousPage: previousPage,
        nextPage: nextPage,
      });
    } catch (error) {
      next(error);
    }
  },
  async getJob(req, res, next) {
    try {
      const jobId = req.query.jobId;
      const job = await Job.findById(jobId);

      if (!job) {
        const error = new Error("Job not found!");
        error.status = 404;
        return next(error);
      }
      return res.status(200).json({ job });
    } catch (error) {
      return next(error);
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
          $sort: { count: -1 }, // Sort by count in descending order
        },
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

  async search(req, res, next) {
    try {
      const company = req.query.company;
      const role = req.query.role;

      const query = {
        // status: "pending",
      };

      let allEmployees = await Employee.find(query).exec();

      let allJobs = await Job.find(query).exec();

      // const appointmentRequests = await AppointmentRequest.find({})
      // .populate('patientId')
      // .exec();

      // Filter appointment requests where mrNo matches
      if (company) {
        const filteredJobs = allEmployees.filter((employee) =>
          employee.company.name.toLowerCase().includes(company.toLowerCase())
        );
        allEmployees = filteredJobs;
      }

      if (role) {
        const filteredJobs = allJobs.filter((job) =>
          job.jobRole.toLowerCase().includes(role.toLowerCase())
        );
        allEmployees = filteredJobs;
      }

      return res.status(200).json({
        results: allEmployees,

        auth: true,
      });
    } catch (error) {
      res.status(500).json({
        status: "Failure",
        error: error.message,
      });
    }
  },
  async searchJobsByRole(req, res, next) {
    try {
      // const companyId = req.query.companyId;
      const role = req.query.role;

      const query = {
        // status: "pending",
      };

      let jobs;

      let allJobs = await Job.find(query).exec();

      if (role) {
        const filteredJobs = allJobs.filter((job) =>
          job.jobRole.toLowerCase().includes(role.toLowerCase())
        );
        jobs = filteredJobs;
      }

      return res.status(200).json({
        results: jobs,

        auth: true,
      });
    } catch (error) {
      res.status(500).json({
        status: "Failure",
        error: error.message,
      });
    }
  },
  // async searchJobs(req, res, next) {
  //   try {
  //     let query = {};

  //     // Check if jobTitle parameter is provided
  //     if (req.query.jobTitle) {
  //       query.jobTitle = { $regex: req.query.jobTitle, $options: "i" };
  //     }

  //     // Check if companyName parameter is provided
  //     let employeeQuery = {};
  //     if (req.query.companyName) {
  //       // Apply partial search using case-insensitive regex
  //       employeeQuery["company.name"] = {
  //         $regex: req.query.companyName,
  //         $options: "i",
  //       };
  //     }

  //     // Find employee documents matching the query
  //     const employees = await Employee.find(employeeQuery);

  //     // If no employees found, return empty result
  //     if (!employees || employees.length === 0) {
  //       return res.json([]);
  //     }

  //     // Extract employeeIds from the found employees
  //     const employeeIds = employees.map((employee) => employee._id);
  //     console.log(employeeIds);

  //     // Use the extracted employeeIds to filter jobs
  //     query.employeeId = { $in: employeeIds };

  //     // Find jobs matching the updated query
  //     const jobs = await Job.find(query);

  //     // Return the found jobs
  //     return res.json(jobs);
  //   } catch (error) {
  //     // Handle errors
  //     console.error("Error searching for jobs:", error);
  //     res.status(500).json({ error: "Internal server error" });
  //   }
  // },

  async applyJob(req, res, next) {
    console.log("chalaaa.....");
    const applyJobSchema = Joi.object({
      jobId: Joi.string().required(),
    });
    const { error } = applyJobSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { jobId } = req.body;
    const senderId = req.user._id;
    let job;

    let updatedJob;

    try {
      // match userId
      job = await Job.findOne({ _id: jobId });

      if (job == null) {
        const error = {
          status: 401,
          message: "Invalid JobId",
        };
        return next(error);
      } else {
        updatedJob = await Job.findOneAndUpdate(
          { _id: jobId },
          { $addToSet: { applicants: senderId } },
          { new: true } // Return the updated document
        );
      }
    } catch (error) {
      return next(error);
    }

    return res
      .status(200)
      .json({ message: "Interest sent successfully!", job: updatedJob });

    // return res.status(200).json({ user: user, auth: true, token: accessToken });
  },
};

module.exports = candidateController;
