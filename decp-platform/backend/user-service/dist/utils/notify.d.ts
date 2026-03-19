/**
 * Fire-and-forget notification helper.
 * Sends an internal HTTP POST to the notification-service.
 * Never blocks or throws — notifications are best-effort.
 */
export declare function sendNotification(userId: string, type: string, title: string, body: string, data?: object): void;
//# sourceMappingURL=notify.d.ts.map