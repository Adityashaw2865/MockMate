export const API = process.env.NEXT_PUBLIC_API || 'http://localhost:4000';
export const WS = process.env.NEXT_PUBLIC_WS || 'ws://localhost:4000';
export const token = () => (typeof window === 'undefined' ? '' : localStorage.getItem('mm_token') || '');
export async function api(path, method = 'GET', body) {
    const r = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
        body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json();
    if (!r.ok)
        throw new Error(d.error || 'Request failed');
    return d;
}
