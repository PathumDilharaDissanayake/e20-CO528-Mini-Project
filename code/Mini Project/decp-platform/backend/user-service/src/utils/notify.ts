/**
 * Fire-and-forget notification helper.
 * Sends an internal HTTP POST to the notification-service.
 * Never blocks or throws — notifications are best-effort.
 */

import http from 'http';

const INTERNAL_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN ||
  'decp-internal-svc-token-change-in-production-2026';

export function sendNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: object
): void {
  const payload = JSON.stringify({ userId, type, title, body, data: data || {} });

  const options: http.RequestOptions = {
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

  const req = http.request(options);
  req.on('error', () => {}); // fire-and-forget — swallow errors
  req.write(payload);
  req.end();
}
