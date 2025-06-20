const express = require("express");
const authController = require("../controllers/authController"); //stores all the functions where the logic is added(req,res)
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/signout", authController.signout);

router.patch("/send-verification-code", authController.sendVerificationCode);
router.patch(
  "/verify-verification-code",
  authController.verifyVerificationCode
);

module.exports = router;
