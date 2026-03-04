"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdSchema = exports.paginationSchema = exports.updateProfileSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateProfileSchema = joi_1.default.object({
    firstName: joi_1.default.string().max(100).allow(''),
    lastName: joi_1.default.string().max(100).allow(''),
    avatar: joi_1.default.string().max(500).allow(''),
    department: joi_1.default.string().max(100).allow(''),
    graduationYear: joi_1.default.number().integer().min(1950).max(2100).allow(null),
    bio: joi_1.default.string().max(1000).allow(''),
    headline: joi_1.default.string().max(200).allow(''),
    location: joi_1.default.string().max(200).allow(''),
    website: joi_1.default.string().uri().max(500).allow(''),
    phone: joi_1.default.string().max(20).allow(''),
    skills: joi_1.default.array().items(joi_1.default.string().max(50)),
    interests: joi_1.default.array().items(joi_1.default.string().max(50)),
    education: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().allow(''),
        // Accept both 'school' (frontend) and 'institution' (legacy)
        school: joi_1.default.string().allow(''),
        institution: joi_1.default.string().allow(''),
        degree: joi_1.default.string().allow(''),
        // Accept both 'field' (frontend) and 'fieldOfStudy' (legacy)
        field: joi_1.default.string().allow(''),
        fieldOfStudy: joi_1.default.string().allow(''),
        startYear: joi_1.default.number().integer().min(1950).max(2100),
        endYear: joi_1.default.number().integer().min(1950).max(2100).allow(null),
        grade: joi_1.default.string().allow(''),
        current: joi_1.default.boolean().default(false)
    })),
    experience: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().allow(''),
        company: joi_1.default.string().required(),
        title: joi_1.default.string().required(),
        location: joi_1.default.string().allow(''),
        startDate: joi_1.default.string().allow(''),
        endDate: joi_1.default.string().allow('', null),
        current: joi_1.default.boolean().default(false),
        description: joi_1.default.string().allow('')
    })),
    socialLinks: joi_1.default.object({
        linkedin: joi_1.default.string().uri().allow(''),
        github: joi_1.default.string().uri().allow(''),
        twitter: joi_1.default.string().uri().allow('')
    }),
    openToWork: joi_1.default.boolean(),
    openToWorkTitle: joi_1.default.string().max(200).allow(''),
    certifications: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().required(),
        name: joi_1.default.string().required(),
        issuer: joi_1.default.string().required(),
        issueDate: joi_1.default.string().required(),
        url: joi_1.default.string().uri().allow('')
    })),
    endorsements: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.array().items(joi_1.default.string())),
    featuredPostId: joi_1.default.string().allow('', null)
});
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10)
});
exports.userIdSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().required()
});
//# sourceMappingURL=validation.js.map