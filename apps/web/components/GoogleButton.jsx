'use client';
import { useEffect, useRef } from 'react';
/** Renders the "Sign in with Google" button when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set. */
export default function GoogleButton({ onCredential }) {
    const ref = useRef(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    useEffect(() => {
        if (!clientId)
            return;
        const init = () => {
            const g = window.google;
            if (!g || !ref.current)
                return;
            g.accounts.id.initialize({ client_id: clientId, callback: (r) => onCredential(r.credential) });
            g.accounts.id.renderButton(ref.current, { theme: 'filled_black', size: 'large', width: 340 });
        };
        if (window.google) {
            init();
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = init;
        document.body.appendChild(s);
    }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps
    if (!clientId)
        return null;
    return <div ref={ref} style={{ marginTop: 12 }}/>;
}
