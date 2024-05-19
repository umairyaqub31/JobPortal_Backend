const express = require("express");
const app = express();
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const User = require("../models/user.js");
const Employee = require("../models/employee.js");
const Candidate = require("../models/candidate.js");
const Job = require("../models/job.js");
const JWTService = require("../services/JWTService.js");
const RefreshToken = require("../models/token.js");
const AccessToken = require("../models/accessToken.js");

const employeeController = {
  //.......................................Register..................................//
  async register(req, res, next) {
    const employeeRegisterSchema = Joi.object({
      fullName: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string().required(),
      company: Joi.object(),
      //   fcmToken: Joi.string(),
    });

    const { error } = employeeRegisterSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { fullName, email, phone, company } = req.body;

    let accessToken;
    let refreshToken;

    let employee;
    try {
      const employeeToRegister = new Employee({
        fullName,
        email,
        phone,
        company,
      });

      employee = await employeeToRegister.save();

      // token generation
      accessToken = JWTService.signAccessToken({ _id: employee._id }, "365d");

      refreshToken = JWTService.signRefreshToken({ _id: employee._id }, "365d");
    } catch (error) {
      return next(error);
    }

    // store refresh token in db
    await JWTService.storeRefreshToken(refreshToken, employee._id);
    await JWTService.storeAccessToken(accessToken, employee._id);

    // 6. response send

    // const userDto = new usertorDto(user);

    return res
      .status(201)
      .json({ user: employee, auth: true, token: accessToken });
  },
  //.......................................Login..................................//

  async login(req, res, next) {
    const employeeLoginSchema = Joi.object({
      phone: Joi.string().required(),
    });
    const { error } = employeeLoginSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { phone } = req.body;

    let employee;

    try {
      // match username
      employee = await Employee.findOne({ phone: phone });

      if (employee == null) {
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
      { _id: employee._id },
      "365d"
    );
    const refreshToken = JWTService.signRefreshToken(
      { _id: employee._id },
      "365d"
    );
    // update refresh token in database
    try {
      await RefreshToken.updateOne(
        {
          userId: employee._id,
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
          userId: employee._id,
        },
        { token: accessToken },
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }

    return res
      .status(200)
      .json({ user: employee, auth: true, token: accessToken });
  },

  //.......................................PostJob..................................//

  async postJob(req, res, next) {
    const jobSchema = Joi.object({
      jobOpenings: Joi.string().required(),
      jobRole: Joi.string().required(),
      jobTitle: Joi.string().required(),
      gender: Joi.string().required(),
      qualification: Joi.string().required(),
      jobBenifit: Joi.string().required(),
      language: Joi.string().required(),
      workingDays: Joi.string().required(),
      shift: Joi.string().required(),
      industry: Joi.string().required(),
      jobArea: Joi.string().required(),
      description: Joi.string().required(),
    });

    const { error } = jobSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const {
      jobOpenings,
      jobRole,
      jobTitle,
      gender,
      qualification,
      jobBenifit,
      language,
      workingDays,
      shift,
      jobArea,
      industry,
      description,
    } = req.body;

    const employeeId = req.user._id;

    let job;
    try {
      const jobToSave = new Job({
        employeeId,
        jobOpenings,
        jobRole,
        jobTitle,
        gender,
        qualification,
        jobBenifit,
        language,
        workingDays,
        shift,
        jobArea,
        industry,
        description,
      });

      job = await jobToSave.save();
    } catch (error) {
      return next(error);
    }

    return res.status(201).json({ job: job, auth: true });
  },

  //.......................................GetJobs..................................//

  async getAllJobs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
      const jobsPerPage = 5;
      const userId = req.user._id;

      const totalJobs = await Job.countDocuments({ employeeId: userId }); // Get the total number of posts for the user
      const totalPages = Math.ceil(totalJobs / jobsPerPage); // Calculate the total number of pages

      const skip = (page - 1) * jobsPerPage; // Calculate the number of posts to skip based on the current page

      const jobs = await Job.find({ employeeId: userId })
        .skip(skip)
        .limit(jobsPerPage);

      let previousPage = page > 1 ? page - 1 : null;
      let nextPage = page < totalPages ? page + 1 : null;
      return res.status(200).json({
        jobs: jobs,
        auth: true,
        totalJobs,
        previousPage: previousPage,
        nextPage: nextPage,
      });
    } catch (error) {
      return next(error);
    }
  },

  //.......................................Get Applicants..................................//

  async getApplicants(req, res, next) {
    try {
      const jobId = req.query.jobId;
      const page = parseInt(req.query.page) || 1;
      const limit = 10;

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const totalApplicants = job.applicants.length;
      const totalPages = Math.ceil(totalApplicants / limit);

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const applicants = await Candidate.find({
        _id: { $in: job.applicants },
      })
        .skip(startIndex)
        .limit(limit);

      const result = {
        job,
        totalApplicants,
        totalPages,
        currentPage: page,
        applicants,
      };

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  // async jobSearch(req, res, next) {
  //   try {
  //     const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
  //     const jobsPerPage = 10;
  //     const search = req.query.search;

  //     const query = {
  //       // status: "pending",
  //     };

  //     let totalJobs = await Job.countDocuments(query);

  //     const totalPages = Math.ceil(totalJobs / jobsPerPage);

  //     const skip = (page - 1) * jobsPerPage;

  //     let allJobs = await Job.find(query)
  //       .sort({ createdAt: -1 })
  //       .skip(skip)
  //       .limit(jobsPerPage)
  //       .exec();

  //     // const appointmentRequests = await AppointmentRequest.find({})
  //     // .populate('patientId')
  //     // .exec();

  //     // Filter appointment requests where mrNo matches
  //     if (search) {
  //       console.log("working");
  //       const filteredJobs = allJobs.filter((appointment) => {
  //         return appointment.patientId.mrNo === mrNo; // update according to search
  //       });
  //       allJobs = filteredJobs;
  //       totalJobs = filteredJobs.length;
  //     }

  //     return res.status(200).json({
  //       jobs: allJobs,
  //       jobsLength: totalJobs,
  //       auth: true,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       status: "Failure",
  //       error: error.message,
  //     });
  //   }
  // },

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
};

module.exports = employeeController;
