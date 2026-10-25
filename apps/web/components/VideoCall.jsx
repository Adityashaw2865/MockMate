'use client';
import { useEffect, useRef, useState } from 'react';
function Remote({ stream }) {
    const ref = useRef(null);
    useEffect(() => { if (ref.current)
        ref.current.srcObject = stream; }, [stream]);
    return <video ref={ref} autoPlay playsInline/>;
}
/** Peer-to-peer video call (WebRTC via PeerJS). Peer IDs are exchanged through the shared Yjs doc. */
export default function VideoCall({ doc }) {
    const localRef = useRef(null);
    const streamRef = useRef(null);
    const [remotes, setRemotes] = useState({});
    const [err, setErr] = useState('');
    const [mic, setMic] = useState(true);
    const [cam, setCam] = useState(true);
    useEffect(() => {
        if (!doc)
            return;
        let peer;
        let dead = false;
        const called = new Set();
        const peers = doc.getMap('peers');
        const add = (id, s) => setRemotes((r) => ({ ...r, [id]: s }));
        (async () => {
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            }
            catch {
                setErr('Camera or microphone is blocked. Allow access and reload.');
                return;
            }
            if (dead) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }
            streamRef.current = stream;
            if (localRef.current)
                localRef.current.srcObject = stream;
            const { default: Peer } = await import('peerjs');
            peer = new Peer();
            peer.on('open', (id) => {
                peers.set(String(doc.clientID), id);
                // The peer with the smaller id starts the call, so both sides never call each other at once.
                const connect = () => peers.forEach((pid) => {
                    if (pid !== id && id < pid && !called.has(pid)) {
                        called.add(pid);
                        peer.call(pid, stream).on('stream', (rs) => add(pid, rs));
                    }
                });
                peers.observe(connect);
                connect();
            });
            peer.on('call', (call) => {
                call.answer(stream);
                call.on('stream', (rs) => add(call.peer, rs));
            });
        })();
        return () => {
            dead = true;
            peers.delete(String(doc.clientID));
            peer?.destroy();
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [doc]);
    const toggle = (kind) => {
        const tracks = kind === 'audio' ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
        tracks?.forEach((t) => (t.enabled = !t.enabled));
        kind === 'audio' ? setMic((m) => !m) : setCam((c) => !c);
    };
    return (<div>
      <div className="vids">
        <div className="vid"><video ref={localRef} autoPlay playsInline muted/><span>You</span></div>
        {Object.entries(remotes).map(([id, s]) => (<div className="vid" key={id}><Remote stream={s}/><span>Participant</span></div>))}
        {Object.keys(remotes).length === 0 && <div className="vid empty">Waiting for the other person…</div>}
      </div>
      {err && <p className="err">{err}</p>}
      <div className="row" style={{ marginTop: 8 }}>
        <button onClick={() => toggle('audio')}>{mic ? 'Mute' : 'Unmute'}</button>
        <button onClick={() => toggle('video')}>{cam ? 'Camera off' : 'Camera on'}</button>
      </div>
    </div>);
}
