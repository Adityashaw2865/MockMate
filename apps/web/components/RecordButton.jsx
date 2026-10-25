'use client';
import { useRef, useState } from 'react';
/** Records the shared screen/tab (with audio) on THIS device and downloads a .webm file. Nothing is uploaded. */
export default function RecordButton() {
    const rec = useRef(null);
    const [on, setOn] = useState(false);
    async function start() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            const chunks = [];
            const r = new MediaRecorder(stream);
            r.ondataavailable = (e) => { if (e.data.size)
                chunks.push(e.data); };
            r.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
                a.download = `mockmate-${Date.now()}.webm`;
                a.click();
                setOn(false);
            };
            stream.getVideoTracks()[0].onended = () => { if (r.state !== 'inactive')
                r.stop(); };
            r.start();
            rec.current = r;
            setOn(true);
        }
        catch { /* user cancelled the screen picker */ }
    }
    return on
        ? <button onClick={() => rec.current?.stop()} style={{ borderColor: '#d9645f', color: '#d9645f' }}>■ Stop recording</button>
        : <button onClick={start} title="Records on your device only. Tell the candidate you are recording.">● Record</button>;
}
