export function clearAuthStorage() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('admin');
  localStorage.removeItem('role');
  sessionStorage.clear();
}

