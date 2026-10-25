'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { api, WS, token } from '@/lib/api';
import VideoCall from '@/components/VideoCall';
import LiveKitCall from '@/components/LiveKitCall';
import Timer from '@/components/Timer';
import Chat from '@/components/Chat';
import Whiteboard from '@/components/Whiteboard';
import QuestionPanel from '@/components/QuestionPanel';
import InviteForm from '@/components/InviteForm';
import RecordButton from '@/components/RecordButton';
export default function Room() {
    const { code } = useParams();
    const router = useRouter();
    const [info, setInfo] = useState(null);
    const [tab, setTab] = useState('code');
    const [lang, setLang] = useState('javascript');
    const [out, setOut] = useState('Press Run to execute your code.');
    const [sc, setSc] = useState({ problemSolving: 3, communication: 3, codeQuality: 3, notes: '' });
    const [msg, setMsg] = useState('');
    const [doc, setDoc] = useState(null);
    const [fb, setFb] = useState(null);
    const [busy, setBusy] = useState(false);
    const editorRef = useRef(null);
    const cleanup = useRef();
    const isHost = !!info?.isHost;
    const useLiveKit = !!process.env.NEXT_PUBLIC_LIVEKIT_URL;
    useEffect(() => {
        if (!token()) {
            localStorage.setItem('mm_next', location.pathname);
            router.push('/');
            return;
        }
        api('/rooms/' + code).then(setInfo).catch(() => router.push('/'));
        return () => cleanup.current?.();
    }, [code, router]);
    async function onMount(editor) {
        editorRef.current = editor;
        const d = new Y.Doc();
        const provider = new WebsocketProvider(WS, 'mockmate-' + code, d); // real-time sync
        const { MonacoBinding } = await import('y-monaco');
        new MonacoBinding(d.getText('code'), editor.getModel(), new Set([editor]), provider.awareness);
        // The selected language is shared, so both people always run the same language.
        const meta = d.getMap('meta');
        const readLang = () => setLang(String(meta.get('lang') || 'javascript'));
        meta.observe(readLang);
        provider.on('sync', readLang);
        // Record snapshots (debounced) for session replay. The server skips duplicates.
        let timer;
        let last = '';
        const sub = editor.onDidChangeModelContent(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const v = editor.getValue();
                if (v !== last) {
                    last = v;
                    api(`/rooms/${code}/snapshots`, 'POST', { code: v }).catch(() => { });
                }
            }, 3000);
        });
        cleanup.current = () => { clearTimeout(timer); sub.dispose(); provider.destroy(); d.destroy(); };
        setDoc(d);
    }
    const changeLang = (v) => { setLang(v); doc?.getMap('meta').set('lang', v); };
    async function run() {
        setOut('Running…');
        try {
            setOut((await api('/run', 'POST', { language: lang, code: editorRef.current.getValue() })).output);
        }
        catch (e) {
            setOut('Error: ' + e.message);
        }
    }
    async function save() {
        try {
            await api(`/rooms/${code}/scorecard`, 'POST', sc);
            setMsg('Scorecard saved ✓');
        }
        catch (e) {
            setMsg(e.message);
        }
    }
    async function genFeedback() {
        setBusy(true);
        setMsg('');
        try {
            await api(`/rooms/${code}/scorecard`, 'POST', sc);
            setFb(await api(`/rooms/${code}/feedback`, 'POST', { ...sc, language: lang, code: editorRef.current.getValue() }));
        }
        catch (e) {
            setMsg(e.message);
        }
        setBusy(false);
    }
    const slider = (k, label) => (<label key={k}>{label}: <b>{sc[k]}</b>
      <input type="range" min={1} max={5} value={sc[k]} onChange={(e) => setSc({ ...sc, [k]: +e.target.value })}/>
    </label>);
    if (!info)
        return <div className="wrap"><p className="m">Loading room…</p></div>;
    return (<div className="room">
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="bar">
          <b>Room {code}</b>
          <span className="badge">{isHost ? 'Interviewer' : 'Candidate'}</span>
          <button onClick={() => navigator.clipboard.writeText(location.href)}>Copy invite link</button>
          <select style={{ width: 130, margin: 0 }} value={lang} onChange={(e) => changeLang(e.target.value)}>
            <option value="javascript">JavaScript</option><option value="python">Python</option>
            <option value="cpp">C++</option><option value="java">Java</option>
          </select>
          <span style={{ flex: 1 }}/>
          {isHost && <RecordButton />}
          <button className="pri" style={{ width: 'auto' }} onClick={run}>▶ Run</button>
        </div>
        <div className="tabs">
          <button className={'tab' + (tab === 'code' ? ' on' : '')} onClick={() => setTab('code')}>Code</button>
          <button className={'tab' + (tab === 'board' ? ' on' : '')} onClick={() => setTab('board')}>Whiteboard</button>
        </div>
        <div style={{ display: tab === 'code' ? 'block' : 'none' }}>
          <Editor height="52vh" theme="vs-dark" language={lang} onMount={onMount} options={{ automaticLayout: true, minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', Menlo, monospace" }} defaultValue={'// Both people can type here at the same time\n'}/>
          <pre className="out">{out}</pre>
        </div>
        <div style={{ display: tab === 'board' ? 'block' : 'none' }}><Whiteboard doc={doc}/></div>
      </div>

      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <div className="card"><h3 style={{ marginTop: 0 }}>Video call</h3>
          {useLiveKit ? <LiveKitCall code={code}/> : <VideoCall doc={doc}/>}
        </div>
        <div className="card"><Timer doc={doc} isHost={isHost}/></div>
        <div className="card"><h3 style={{ marginTop: 0 }}>Question</h3><QuestionPanel doc={doc} isHost={isHost} lang={lang}/></div>
        <div className="card"><h3 style={{ marginTop: 0 }}>Chat</h3><Chat doc={doc}/></div>

        {isHost ? (<div className="card">
            <h3 style={{ marginTop: 0 }}>Scorecard <span className="m" style={{ fontSize: 12 }}>(only you can see this)</span></h3>
            {slider('problemSolving', 'Problem solving')}
            {slider('communication', 'Communication')}
            {slider('codeQuality', 'Code quality')}
            <textarea rows={4} placeholder="Interview notes…" onChange={(e) => setSc({ ...sc, notes: e.target.value })}/>
            <div className="row">
              <button onClick={save}>Save</button>
              <button className="alt" disabled={busy} onClick={genFeedback}>{busy ? 'Thinking…' : 'AI feedback'}</button>
            </div>
            {msg && <p className="m" style={{ marginTop: 10 }}>{msg}</p>}
            {fb && (<div className="fb">
                <p>{fb.summary}</p>
                <b>Strengths</b><ul>{fb.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <b>To improve</b><ul>{fb.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>)}
            <InviteForm code={code}/>
            {info.shareToken && (<div className="row" style={{ marginTop: 10 }}>
                <button onClick={() => navigator.clipboard.writeText(location.origin + '/report/' + info.shareToken)}>Copy shareable report link</button>
                <button onClick={() => router.push('/replay/' + code)}>Replay</button>
              </div>)}
          </div>) : (<div className="card"><p className="m" style={{ margin: 0 }}>Good luck! Your interviewer will share a report after the interview.</p></div>)}
      </div>
    </div>);
}
