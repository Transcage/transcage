/**
 * Transcage API Client
 * Base: /api (proxied to localhost:7070 in dev via vite.config.js)
 * All calls return: { success, message, data } or throw on network error
 */

const BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('tc_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  return json;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const AuthAPI = {
  register: (data) => request('POST', '/auth/register', data),
  login:    (data) => request('POST', '/auth/login', data),
  me:       ()     => request('GET',  '/auth/me')
};

// ── Tracking ─────────────────────────────────────────────────────────────────
export const TrackAPI = {
  lookup: (trackingNumber) => request('GET', `/track/${encodeURIComponent(trackingNumber)}`)
};

// ── Customer ─────────────────────────────────────────────────────────────────
export const CustomerAPI = {
  getShipments:   (page = 1) => request('GET',  `/customer/shipments?page=${page}`),
  createShipment: (data)     => request('POST', '/customer/shipments', data),
  getShipment:    (id)       => request('GET',  `/customer/shipments/${id}`),
  approvePricing: (id)       => request('POST', `/customer/shipments/${id}/approve-price`),
  cancelShipment: (id, reason) => request('POST', `/customer/shipments/${id}/cancel`, { reason })
};

// ── Clerk ─────────────────────────────────────────────────────────────────────
export const ClerkAPI = {
  getQueue:         ()         => request('GET',  '/clerk/queue'),
  inspectShipment:  (id, data) => request('POST', `/clerk/shipments/${id}/inspect`, data),
  recordPayment:    (id, data) => request('POST', `/clerk/shipments/${id}/payment`, data),
  assignDriver:     (id, data) => request('POST', `/clerk/shipments/${id}/assign-driver`, data),
  getDrivers:       ()         => request('GET',  '/clerk/drivers')
};

// ── Driver ────────────────────────────────────────────────────────────────────
export const DriverAPI = {
  getAssignments:   ()         => request('GET',  '/driver/assignments'),
  acceptCustody:    (id, data) => request('POST', `/driver/shipments/${id}/accept-custody`, data),
  deliver:          (id, data) => request('POST', `/driver/shipments/${id}/deliver`, data),
  updateStatus:     (status)   => request('POST', '/driver/status', { status })
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const AdminAPI = {
  getStats:           ()         => request('GET',  '/admin/stats'),
  getCompanies:       ()         => request('GET',  '/admin/companies'),
  reviewCompany:      (id, data) => request('POST', `/admin/companies/${id}/review`, data),
  getDriverApps:      ()         => request('GET',  '/admin/driver-applications'),
  reviewDriver:       (id, data) => request('POST', `/admin/drivers/${id}/review`, data),
  getDisputes:        ()         => request('GET',  '/admin/disputes'),
  resolveDispute:     (id, data) => request('POST', `/admin/disputes/${id}/resolve`, data),
  getUsers:           ()         => request('GET',  '/admin/users')
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const NotifAPI = {
  list:    () => request('GET',  '/notifications'),
  markRead:(id) => request('POST', `/notifications/${id}/read`),
  markAllRead: () => request('POST', '/notifications/read-all')
};
