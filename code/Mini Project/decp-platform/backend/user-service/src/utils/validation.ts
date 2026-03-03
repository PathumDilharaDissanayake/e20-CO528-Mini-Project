import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100).allow(''),
  lastName: Joi.string().max(100).allow(''),
  avatar: Joi.string().max(500).allow(''),
  department: Joi.string().max(100).allow(''),
  graduationYear: Joi.number().integer().min(1950).max(2100).allow(null),
  bio: Joi.string().max(1000).allow(''),
  headline: Joi.string().max(200).allow(''),
  location: Joi.string().max(200).allow(''),
  website: Joi.string().uri().max(500).allow(''),
  phone: Joi.string().max(20).allow(''),
  skills: Joi.array().items(Joi.string().max(50)),
  interests: Joi.array().items(Joi.string().max(50)),
  education: Joi.array().items(Joi.object({
    institution: Joi.string().required(),
    degree: Joi.string().required(),
    fieldOfStudy: Joi.string().required(),
    startYear: Joi.number().integer().min(1950).max(2100).required(),
    endYear: Joi.number().integer().min(1950).max(2100),
    current: Joi.boolean().default(false)
  })),
  experience: Joi.array().items(Joi.object({
    company: Joi.string().required(),
    title: Joi.string().required(),
    location: Joi.string().allow(''),
    startDate: Joi.string().isoDate().required(),
    endDate: Joi.string().isoDate(),
    current: Joi.boolean().default(false),
    description: Joi.string().allow('')
  })),
  socialLinks: Joi.object({
    linkedin: Joi.string().uri().allow(''),
    github: Joi.string().uri().allow(''),
    twitter: Joi.string().uri().allow('')
  })
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

export const userIdSchema = Joi.object({
  userId: Joi.string().uuid().required()
});
