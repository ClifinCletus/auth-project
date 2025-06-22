const Joi = require("joi");

// Schema for input data validation
exports.signupSchema = Joi.object({
  // Email schema: string, min 6 chars, max 60 chars, required, only .com or .net domains
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),

  // Password schema: required, min 8 chars, must contain lowercase, uppercase, and digit
  password: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters with at least one lowercase letter, one uppercase letter, and one digit",
    }),
});

exports.signinSchema = Joi.object({
  // Email schema: string, min 6 chars, max 60 chars, required, only .com or .net domains
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),

  // Password schema: required, min 8 chars, must contain lowercase, uppercase, and digit
  password: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters with at least one lowercase letter, one uppercase letter, and one digit",
    }),
});

exports.acceptCodeSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  providedCode: Joi.number().required(),
});

exports.changePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters with at least one lowercase letter, one uppercase letter, and one digit",
    }),
  oldPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters with at least one lowercase letter, one uppercase letter, and one digit",
    }),
});

//for thr forgot password input(email,code,newpassword)
exports.acceptFPCodeSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  providedCode: Joi.number().required(),
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters with at least one lowercase letter, one uppercase letter, and one digit",
    }),
});

//to check the given details to create a post
exports.createPostSchema = Joi.object({
  title: Joi.string().min(3).max(60).required(),
  description: Joi.string().min(3).max(600).required(),
  userId: Joi.string().required()
});
