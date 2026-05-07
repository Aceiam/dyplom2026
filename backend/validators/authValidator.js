const Joi = require('joi');

const chdtuEmail = Joi.string()
  .trim()
  .lowercase()
  .email()
  .pattern(/@chdtu\.edu\.ua$/)
  .required()
  .messages({
    'string.email': 'email must be valid',
    'string.pattern.base': 'email must use @chdtu.edu.ua domain',
  });

const registerSchema = Joi.object({
  full_name: Joi.string().trim().min(3).required(),
  email: chdtuEmail,
  password: Joi.string().min(8).max(128).required(),
  remember: Joi.boolean().default(false),
}).unknown(false);

const loginSchema = Joi.object({
  email: chdtuEmail,
  password: Joi.string().min(1).max(128).required(),
  remember: Joi.boolean().default(false),
}).unknown(false);

module.exports = {
  registerSchema,
  loginSchema,
};
