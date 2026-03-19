"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = require("../config");
const router = (0, express_1.Router)();
router.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config_1.config.nodeEnv,
        services: {
            auth: config_1.config.services.auth,
            user: config_1.config.services.user,
            feed: config_1.config.services.feed,
            jobs: config_1.config.services.jobs,
            events: config_1.config.services.events,
            research: config_1.config.services.research,
            messaging: config_1.config.services.messaging,
            notification: config_1.config.services.notification,
            analytics: config_1.config.services.analytics
        }
    };
    res.status(200).json({
        success: true,
        message: 'API Gateway is healthy',
        data: health
    });
});
router.get('/ready', (req, res) => {
    // In a real scenario, check all downstream services
    res.status(200).json({
        success: true,
        message: 'API Gateway is ready'
    });
});
exports.default = router;
//# sourceMappingURL=healthRoutes.js.map