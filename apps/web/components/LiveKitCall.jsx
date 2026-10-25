'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
/** Group video call through LiveKit (used when NEXT_PUBLIC_LIVEKIT_URL is set). Supports more than 2 people. */
export default function LiveKitCall({ code }) {
    const box = useRef(null);
    const roomRef = useRef(null);
    const [err, setErr] = useState('');
    const [mic, setMic] = useState(true);
    const [cam, setCam] = useState(true);
    useEffect(() => {
        let dead = false;
        (async () => {
            try {
                const { Room, RoomEvent, Track } = await import('livekit-client');
                const { token } = await api(`/rooms/${code}/livekit-token`, 'POST');
                if (dead)
                    return;
                const room = new Room();
                roomRef.current = room;
                const add = (el) => {
                    const wrap = document.createElement('div');
                    wrap.className = 'vid';
                    wrap.appendChild(el);
                    box.current?.appendChild(wrap);
                };
                room.on(RoomEvent.TrackSubscribed, (track) => {
                    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio)
                        add(track.attach());
                });
                room.on(RoomEvent.TrackUnsubscribed, (track) => {
                    track.detach().forEach((el) => el.parentElement?.remove());
                });
                await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL, token);
                await room.localParticipant.enableCameraAndMicrophone();
                const local = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
                if (local) {
                    const el = local.attach();
                    el.muted = true;
                    add(el);
                }
            }
            catch (e) {
                setErr(e.message);
            }
        })();
        return () => { dead = true; roomRef.current?.disconnect(); };
    }, [code]);
    return (<div>
      <div className="vids" ref={box}/>
      {err && <p className="err">{err}</p>}
      <div className="row" style={{ marginTop: 8 }}>
        <button onClick={async () => { await roomRef.current?.localParticipant.setMicrophoneEnabled(!mic); setMic(!mic); }}>{mic ? 'Mute' : 'Unmute'}</button>
        <button onClick={async () => { await roomRef.current?.localParticipant.setCameraEnabled(!cam); setCam(!cam); }}>{cam ? 'Camera off' : 'Camera on'}</button>
      </div>
    </div>);
}
