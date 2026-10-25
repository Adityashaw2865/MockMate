'use client';
import { useEffect, useRef, useState } from 'react';
/** Room chat stored in a shared Yjs array. */
export default function Chat({ doc }) {
    const [msgs, setMsgs] = useState([]);
    const [text, setText] = useState('');
    const box = useRef(null);
    useEffect(() => {
        if (!doc)
            return;
        const arr = doc.getArray('chat');
        const read = () => setMsgs(arr.toArray());
        read();
        arr.observe(read);
        return () => arr.unobserve(read);
    }, [doc]);
    useEffect(() => { box.current?.scrollTo(0, box.current.scrollHeight); }, [msgs]);
    function send() {
        const t = text.trim();
        if (!t || !doc)
            return;
        doc.getArray('chat').push([{ n: localStorage.getItem('mm_name') || 'Guest', t, ts: Date.now() }]);
        setText('');
    }
    return (<div>
      <div className="chat" ref={box}>
        {msgs.length === 0 && <span className="m">No messages yet.</span>}
        {msgs.map((m, i) => <div key={i}><b>{m.n}:</b> {m.t}</div>)}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <input style={{ margin: 0 }} placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}/>
        <button onClick={send}>Send</button>
      </div>
    </div>);
}
