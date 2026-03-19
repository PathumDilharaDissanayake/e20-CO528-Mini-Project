import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 400 },   // Ramp up to 400 users
    { duration: '5m', target: 600 },   // Ramp up to 600 users
    { duration: '5m', target: 800 },   // Ramp up to 800 users
    { duration: '10m', target: 800 },  // Hold at 800 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Login simulation
  let loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: `user${__VU}@test.com`,
    password: 'Password123!',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  if (loginRes.status === 200) {
    let token = JSON.parse(loginRes.body).data.tokens.accessToken;
    
    let headers = {
      Authorization: `Bearer ${token}`,
    };

    // Authenticated requests
    let profileRes = http.get(`${BASE_URL}/api/users/profile`, { headers });
    check(profileRes, {
      'profile fetched': (r) => r.status === 200,
    });

    let feedRes = http.get(`${BASE_URL}/api/posts`, { headers });
    check(feedRes, {
      'feed fetched': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 3 + 1);
}
