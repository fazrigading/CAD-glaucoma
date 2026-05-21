export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const merged = { ...defaultOptions, ...options };

  if (options?.body instanceof FormData) {
    delete merged.headers;
  }

  const response = await fetch(url, merged);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let data: unknown;
    try {
      const body = await response.json();
      message = body.message || message;
      data = body;
    } catch {
      // Response is not JSON
    }

    if (response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    throw new ApiError(response.status, message, data);
  }

  return response.json();
}
