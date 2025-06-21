const express = require("express");
const authController = require("../controllers/authController"); //stores all the functions where the logic is added(req,res)
const router = express.Router();
const {identifier} = require('../middlewares/identification')

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/signout",identifier, authController.signout);

router.patch("/send-verification-code",identifier, authController.sendVerificationCode);
router.patch(
  "/verify-verification-code",identifier,
  authController.verifyVerificationCode
);
router.patch(
  "/change-password",identifier,
  authController.changePassword
);

module.exports = router;
