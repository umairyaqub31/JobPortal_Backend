const express = require("express");
const userAuthController = require("../controller/userAuthController");
const multer = require("multer");
const employeeController = require("../controller/employeeController");
const candidateController = require("../controller/candidateController");
const uploadFileController = require("../controller/uploadFileController");
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
router.get("/employee/getAllJobs", employeeController.getAllJobs);
router.get("/employee/getApplicants", auth, employeeController.getApplicants);

//.............candidate.....................
router.post("/candidate/register", candidateController.register);
router.post("/candidate/login", candidateController.login);
router.post("/candidate/logout", auth, candidateController.logout);
router.get("/candidate/getTopCompanies", candidateController.getTopCompanies);
router.get("/candidate/getCompanyJobs", candidateController.getCompanyJobs);
router.get("/candidate/getJob", candidateController.getJob);

router.get("/candidate/getJobRoles", candidateController.getJobRoles);
router.get("/candidate/searchJobsByRole", candidateController.searchJobsByRole);

//.............uploadFile.....................
router.post(
  "/candidate/uploadFile",
  upload.single("file"),
  uploadFileController.uploadFile
);

router.post("/candidate/applyJob", auth, candidateController.applyJob);
router.get("/candidate/search", candidateController.search);

module.exports = router;
