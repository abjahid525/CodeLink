export function getStoredUser() {
  const raw = localStorage.getItem('codelink-user');
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return localStorage.getItem('codelink-token');
}

export function clearSession() {
  localStorage.removeItem('codelink-user');
  localStorage.removeItem('codelink-token');
}

export function authHeaders(extraHeaders = {}) {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function requireAuth() {
  const user = getStoredUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}
