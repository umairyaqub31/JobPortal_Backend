const JWTService = require("../services/JWTService");
const User = require("../models/user");
// const Vendor = require("../models/vendor/vendor");
const AccessToken = require("../models/accessToken");
const Employee = require("../models/employee");

const auth = async (req, res, next) => {
  // console.log("auth chala");
  try {
    // 1. refresh, access token validation
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    const ifTokenExists = await AccessToken.find({ token: accessToken });
    if (ifTokenExists == "") {
      const error = {
        status: 401,
        message: "Unauthorized",
      };
      return next(error);
    }

    if (!accessToken) {
      const error = {
        status: 401,
        message: "Unauthorized",
      };

      return next(error);
    }
    // console.log(accessToken)

    let _id;

    try {
      _id = JWTService.verifyAccessToken(accessToken)._id;
    } catch (error) {
      return next(error);
    }
    let user;
    if (req.originalUrl.includes("/user")) {
      try {
        user = await User.findOne({ _id: _id });
      } catch (error) {
        return next(error);
      }

      req.user = user;

      next();
      return;
    }

    if (req.originalUrl.includes("/employee")) {
      try {
        user = await Employee.findOne({ _id: _id });
      } catch (error) {
        return next(error);
      }

      req.user = user;

      next();
      return;
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = auth;
