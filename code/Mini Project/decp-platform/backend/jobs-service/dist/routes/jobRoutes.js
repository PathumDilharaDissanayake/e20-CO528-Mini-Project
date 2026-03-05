"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobController_1 = require("../controllers/jobController");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get('/', jobController_1.getJobs);
router.post('/', jobController_1.createJob);
router.get('/applications', jobController_1.getMyApplications);
router.get('/:jobId', jobController_1.getJob);
router.put('/:jobId', jobController_1.updateJob);
router.delete('/:jobId', jobController_1.deleteJob);
router.post('/:jobId/apply', upload_1.memoryUpload.single('resume'), upload_1.saveFile, jobController_1.applyForJob);
router.put('/applications/:applicationId/status', jobController_1.updateApplicationStatus);
exports.default = router;
//# sourceMappingURL=jobRoutes.js.map