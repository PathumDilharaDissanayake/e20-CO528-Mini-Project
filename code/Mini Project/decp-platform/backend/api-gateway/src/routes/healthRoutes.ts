import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: Record<string, string>;
}

router.get('/health', (req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
    services: {
      auth: config.services.auth,
      user: config.services.user,
      feed: config.services.feed,
      jobs: config.services.jobs,
      events: config.services.events,
      research: config.services.research,
      messaging: config.services.messaging,
      notification: config.services.notification,
      analytics: config.services.analytics
    }
  };

  res.status(200).json({
    success: true,
    message: 'API Gateway is healthy',
    data: health
  });
});

router.get('/ready', (req: Request, res: Response) => {
  // In a real scenario, check all downstream services
  res.status(200).json({
    success: true,
    message: 'API Gateway is ready'
  });
});

export default router;
