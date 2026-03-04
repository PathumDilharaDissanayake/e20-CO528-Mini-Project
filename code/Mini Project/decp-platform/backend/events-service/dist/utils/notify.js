"use strict";
/**
 * Fire-and-forget notification helper.
 * Sends an internal HTTP POST to the notification-service.
 * Never blocks or throws — notifications are best-effort.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const http_1 = __importDefault(require("http"));
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ||
    'decp-internal-svc-token-change-in-production-2026';
function sendNotification(userId, type, title, body, data) {
    const payload = JSON.stringify({ userId, type, title, body, data: data || {} });
    const options = {
        hostname: 'localhost',
        port: 3008,
        path: '/internal/notify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'x-internal-token': INTERNAL_TOKEN,
        },
    };
    const req = http_1.default.request(options);
    req.on('error', () => { }); // fire-and-forget — swallow errors
    req.write(payload);
    req.end();
}
