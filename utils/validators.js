const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'organizer', 'admin'),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/)
});

const eventSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  date: Joi.date().iso().greater('now').required(),
  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: Joi.string().required(),
  organizer_id: Joi.number().integer().positive().required(),
  max_attendees: Joi.number().integer().min(1).max(10000),
  category: Joi.string(),
  price: Joi.number().min(0)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const registrationSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  event_id: Joi.number().integer().positive().required(),
  additional_info: Joi.object()
});

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return { error: errors.join(', ') };
  }
  return { value };
};

module.exports = {
  validateUser: (data) => validate(userSchema, data),
  validateEvent: (data) => validate(eventSchema, data),
  validateLogin: (data) => validate(loginSchema, data),
  validateRegistration: (data) => validate(registrationSchema, data)
};