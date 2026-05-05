const API_BASE = '/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let errorMsg = 'API request failed';
    try {
      const errorData = JSON.parse(text);
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      errorMsg = `${response.status} ${response.statusText}: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
