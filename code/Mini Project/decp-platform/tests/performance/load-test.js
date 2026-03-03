import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Ramp up
    { duration: '5m', target: 200 },   // Steady state
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],     // Less than 1% errors
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Health check
  let healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(healthRes.status !== 200);

  // Test 2: Get feed posts
  let feedRes = http.get(`${BASE_URL}/api/posts?page=1&limit=20`);
  check(feedRes, {
    'feed status is 200': (r) => r.status === 200,
    'feed response has data': (r) => JSON.parse(r.body).data !== undefined,
    'feed response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(feedRes.status !== 200);

  // Test 3: Get jobs
  let jobsRes = http.get(`${BASE_URL}/api/jobs?page=1&limit=10`);
  check(jobsRes, {
    'jobs status is 200': (r) => r.status === 200,
    'jobs response time < 400ms': (r) => r.timings.duration < 400,
  });
  errorRate.add(jobsRes.status !== 200);

  // Test 4: Get events
  let eventsRes = http.get(`${BASE_URL}/api/events?page=1&limit=10`);
  check(eventsRes, {
    'events status is 200': (r) => r.status === 200,
    'events response time < 400ms': (r) => r.timings.duration < 400,
  });
  errorRate.add(eventsRes.status !== 200);

  sleep(1);
}
