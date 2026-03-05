const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
        // Try to get a useful error message from the server response body
        let errMsg = response.statusText;
        try {
            const body = await response.json();
            if (body?.error) errMsg = body.error;
        } catch (_) { /* ignore parse error */ }
        throw new Error(errMsg);
    }
    return response.json();
}

export async function apiPost<T>(endpoint: string, body: any): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

export async function apiPut<T>(endpoint: string, body: any): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'DELETE'
    });
}
