const express = require("express");
const userAuthController = require("../controller/userAuthController");
const multer = require("multer");
const employeeController = require("../controller/employeeController");
const router = express.Router();
// const upload = multer({ dest: "/temp" });
const auth = require("../middlewares/auth");
const storage = multer.diskStorage({
  destination: "./temp", // Update the destination path
});

const upload = multer({ storage: storage });

//..............auth...............
// router.post("/user/register", userAuthController.register);
router.post("/user/login", userAuthController.login);

//.............Employee................................

router.post("/employee/register", employeeController.register);
router.post("/employee/login", employeeController.login);
router.post("/employee/postJob", auth, employeeController.postJob);
router.get("/employee/getAllJobs", auth, employeeController.getAllJobs);

module.exports = router;
