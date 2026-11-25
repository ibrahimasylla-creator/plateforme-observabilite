import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '20s',
};

const BASE_URL = __ENV.BASE_URL || 'http://gateway:4000';

export default function () {
  const roll = Math.random();
  const headers = { 'Content-Type': 'application/json' };

  if (roll < 0.1) {
    headers['X-Chaos-Force-Error'] = 'true';
  } else if (roll < 0.2) {
    headers['X-Chaos-Delay-Ms'] = '500';
  }

  const payload = JSON.stringify({
    userId: `USR-LOAD-${__VU}`,
    userName: `Utilisateur Charge ${__VU}`,
    amount: 199.99,
    items: [{ id: 'ITM-LOAD', name: 'Article Test', quantity: 1 }],
  });

  const res = http.post(`${BASE_URL}/api/orders`, payload, { headers });

  check(res, {
    'status est 201 ou 500 attendu': (r) => r.status === 201 || r.status === 500,
  });

  sleep(0.2);
}
