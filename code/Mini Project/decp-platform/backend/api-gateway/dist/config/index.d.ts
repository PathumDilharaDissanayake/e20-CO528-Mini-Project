export declare const config: {
    nodeEnv: string;
    port: number;
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    services: {
        auth: string;
        user: string;
        feed: string;
        jobs: string;
        events: string;
        research: string;
        messaging: string;
        notification: string;
        analytics: string;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    strictRateLimit: {
        windowMs: number;
        max: number;
    };
    cors: {
        origin: string[];
    };
};
//# sourceMappingURL=index.d.ts.map