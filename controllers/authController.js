const jwt = require("jsonwebtoken");
const {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} = require("../middlewares/validator");
const User = require("../models/usersModel");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");
const { compareSync } = require("bcryptjs");

exports.signup = async (req, res) => {
  //when signup, gets email and password data and do things in it
  if (!req.body) {
    return res
      .status(400)
      .json({ success: false, message: "Request body is missing" });
  }
  const { email, password } = req.body;
  try {
    // the data is passed to the joi to check and if any error, return the error or else some value
    const { error } = signupSchema.validate({ email, password });
    if (error) {
      //if error pass it
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    //to check if any user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User already exists !" });
    }

    const hashedPassword = await doHash(password, 12); //fn to hash password

    //creating newuser
    const newUser = new User({ email, password: hashedPassword });
    const result = await newUser.save(); //adding user to db

    result.password = undefined; //the user is been created, hence we would send the result to user, but it may not include the user password for security reason

    res.status(201).json({
      success: true,
      message: "Your account has been created successfully",
      result,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      //if error pass it
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password"); //added select + password because while defining the schema, we have given only to provide password if asked
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists !" });
    }

    //to check the password provided by user and the password in the db for login
    const result = await doHashValidation(password, existingUser.password);

    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    //if the user is logged in properly, then create a jwt token with the details from db abd to create the token add a token at the end(a string to create the jwt token(learned before))
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "8h" } //expires in 8h
    );

    //we are sending a cookie as Authorization : Bearen jwt_token (known), then with the expires we are setting to work in http if in production mode and be secure
    res
      .cookie("Authorization", "Bearer" + token, {
        expires: new Date(Date.now() + 10000000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        sucess: true,
        token,
        message: "logged in successfully",
      });
  } catch (error) {
    console.log(error);
  }
};

exports.signout = async (req, res) => {
  res.clearCookie("Authorization").status(200).json({
    success: true,
    message: "logged out successfully",
  });
};

///////////////

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }
    if (existingUser.verified) {
      //if already verified the user via mail
      return res
        .status(400)
        .json({ success: false, message: "You are already verified" });
    }

    //proper 6 digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    let info = await transport.sendMail({
      //to send email to the user who is trying to log in, the transport fn is defined in middlewares
      from: process.env.NODE_CODE_SENDER_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "verification code",
      html: `<h1>Your verification code is: ${verificationCode}</h1>`, //sends the verification code as in like a html h1 tag
    });

    if (info.accepted[0] === existingUser.email) {
      //if the code is received to the logging in user
      //we need to save the validationcode in the db (its hashedvalue). but using bcrypt to hash it makes operation slower, hence used hmac
      const hashedVerificationCode = hmacProcess(
        verificationCode.toString(),
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedVerificationCode;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save(); //we can do like this to update the values of the existingUser in the db, its more simple using this

      return res.status(200).json({ success: true, message: "code sent!" });
    }
    //if failed to send email
    res.status(400).json({ success: false, message: "code sent failed! " });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//to verify the code given by user with the one we send via email
exports.verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    //we need to validate the input from the user via joi
    const { error, value } = acceptCodeSchema.validate({ email, providedCode });
    if (error) {
      //if error pass it
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = String(providedCode).trim();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    ); //by defult not get these, so manually saying to provide them also
    console.log(existingUser);

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    if (existingUser.verified) {
      return res
        .status(400)
        .json({ success: false, message: "you are already verified" });
    }

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValdation
    ) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new code.",
      });
    }

    //if the code has been send 5 mins ago and not been verified by user, it expires and remove it from the db
    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res.status(400).json({
        success: false,
        message: "code has been expired!",
      });
    }

    //checks if the provided code and the code in db is same, if so makes verified and remove the code from db
    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValdation = undefined;
      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "your account have been verified successfully",
      });
    }

    //if anything other than the above occurs, send the message as this
    return res.status(400).json({
      success: false,
      message: "Invalid verification code. Please try again.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.changePassword = async (req, res) => {
  //checking initially if the user is logged in and verified via verification code
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    //first checks the old and newpassword inputed format is correct
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    //optional
    if (!verified) {
      return res
        .status(401)
        .json({ success: false, message: "You are not verified user !" });
    }

    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }

    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return req
        .status(401)
        .json({ success: false, message: "Invalid credentials! " });
    }

    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    return res
      .status(200)
      .json({ success: true, message: "Password updated !!" });
  } catch (error) {
    console.log(error);
  }
};

//to do forgetpassword(similar as sendverificationcode and verifyVerificationCode)

exports.sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    //proper 6 digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    let info = await transport.sendMail({
      //to send email to the user who is trying to log in, the transport fn is defined in middlewares
      from: process.env.NODE_CODE_SENDER_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Forgot Password code",
      html: `<h1>Your Code to reset password is: ${verificationCode}</h1>`, //sends the verification code as in like a html h1 tag
    });

    if (info.accepted[0] === existingUser.email) {
      //if the code is received to the logging in user
      //we need to save the validationcode in the db (its hashedvalue). but using bcrypt to hash it makes operation slower, hence used hmac
      const hashedVerificationCode = hmacProcess(
        verificationCode.toString(),
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedVerificationCode;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save(); //we can do like this to update the values of the existingUser in the db, its more simple using this

      return res.status(200).json({ success: true, message: "code sent!" });
    }
    //if failed to send email
    res.status(400).json({ success: false, message: "code sent failed! " });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//to verify the code given by user with the one we send via email
exports.verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    //we need to validate the input from the user via joi
    const { error, value } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword
    });
    if (error) {
      //if error pass it
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = String(providedCode).trim();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    ); //by defult not get these, so manually saying to provide them also
    console.log(existingUser);

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new code.",
      });
    }

    //if the code has been send 5 mins ago and not been verified by user, it expires and remove it from the db
    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();
      return res.status(400).json({
        success: false,
        message: "code has been expired!",
      });
    }

    //checks if the provided code and the code in db is same, if so makes verified and remove the code from db
    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await doHash(newPassword, 12);
      existingUser.password = hashedPassword
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValdation = undefined;
      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Password Updated!",
      });
    }

    //if anything other than the above occurs, send the message as this
    return res.status(400).json({
      success: false,
      message: "Invalid verification code. Please try again.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
