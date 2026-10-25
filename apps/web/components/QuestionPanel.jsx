'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
/** Interviewer picks (or writes) a question; everybody sees it, and the starter code is loaded into the shared editor. */
export default function QuestionPanel({ doc, isHost, lang }) {
    const [list, setList] = useState([]);
    const [cur, setCur] = useState(null);
    const [sel, setSel] = useState('');
    const [form, setForm] = useState(false);
    const [f, setF] = useState({ title: '', difficulty: 'Medium', description: '' });
    const [err, setErr] = useState('');
    const load = useCallback(() => { api('/questions').then(setList).catch(() => { }); }, []);
    useEffect(() => { if (isHost)
        load(); }, [isHost, load]);
    useEffect(() => {
        if (!doc)
            return;
        const meta = doc.getMap('meta');
        const read = () => setCur(meta.get('question') ?? null);
        read();
        meta.observe(read);
        return () => meta.unobserve(read);
    }, [doc]);
    function pick(id) {
        const q = list.find((x) => x.id === id);
        if (!q || !doc)
            return;
        setSel(id);
        doc.transact(() => {
            doc.getMap('meta').set('question', { title: q.title, difficulty: q.difficulty, description: q.description });
            const t = doc.getText('code');
            t.delete(0, t.length);
            t.insert(0, q.starter[lang] ?? `// ${q.title}\n`);
        });
    }
    async function create() {
        try {
            await api('/questions', 'POST', f);
            setForm(false);
            setF({ title: '', difficulty: 'Medium', description: '' });
            setErr('');
            load();
        }
        catch (e) {
            setErr(e.message);
        }
    }
    async function remove() {
        await api('/questions/' + sel, 'DELETE').catch(() => { });
        setSel('');
        load();
    }
    const selected = list.find((x) => x.id === sel);
    return (<div>
      {isHost && (<>
        <select value={sel} onChange={(e) => pick(e.target.value)}>
          <option value="" disabled>Pick a question…</option>
          {list.map((q) => <option key={q.id} value={q.id}>{q.custom ? '★ ' : ''}[{q.difficulty}] {q.title}</option>)}
        </select>
        <div className="row">
          <button onClick={() => setForm(!form)}>{form ? 'Cancel' : '+ Write your own'}</button>
          {selected?.custom && <button onClick={remove}>Delete</button>}
        </div>
        {form && (<div style={{ marginTop: 8 }}>
            <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}/>
            <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <textarea rows={4} placeholder="Problem statement (at least 10 characters)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}/>
            <button className="pri" onClick={create}>Save question</button>
            {err && <p className="err">{err}</p>}
          </div>)}
      </>)}
      {cur ? (<div className="fb"><b>{cur.title}</b> <span className="badge">{cur.difficulty}</span><p style={{ marginBottom: 0 }}>{cur.description}</p></div>) : (<p className="m" style={{ marginTop: 8 }}>{isHost ? 'Choose a question to share with the candidate.' : 'Waiting for the interviewer to pick a question.'}</p>)}
    </div>);
}
