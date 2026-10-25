'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
const COLORS = ['#8eb69b', '#daf1de', '#e8c48a', '#f0867c'];
/** Shared whiteboard (for system design). Strokes live in a Yjs array, so everyone sees the same drawing. */
export default function Whiteboard({ doc }) {
    const cv = useRef(null);
    const cur = useRef(null);
    const [color, setColor] = useState(COLORS[0]);
    const colorRef = useRef(color);
    colorRef.current = color;
    const draw = useCallback(() => {
        const c = cv.current;
        if (!c || !doc)
            return;
        const dpr = window.devicePixelRatio || 1;
        const w = c.clientWidth, h = c.clientHeight;
        if (c.width !== Math.round(w * dpr)) {
            c.width = Math.round(w * dpr);
            c.height = Math.round(h * dpr);
        }
        const g = c.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, w, h);
        g.lineWidth = 2.5;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        const line = (s) => {
            if (s.p.length < 2)
                return;
            g.strokeStyle = s.c;
            g.beginPath();
            g.moveTo(s.p[0] * w, s.p[1] * h);
            for (let i = 2; i < s.p.length; i += 2)
                g.lineTo(s.p[i] * w, s.p[i + 1] * h);
            g.stroke();
        };
        doc.getArray('strokes').forEach(line);
        if (cur.current)
            line({ c: colorRef.current, p: cur.current });
    }, [doc]);
    useEffect(() => {
        if (!doc)
            return;
        const arr = doc.getArray('strokes');
        arr.observe(draw);
        window.addEventListener('resize', draw);
        const t = setInterval(draw, 1500); // redraw after the tab becomes visible again
        draw();
        return () => { arr.unobserve(draw); window.removeEventListener('resize', draw); clearInterval(t); };
    }, [doc, draw]);
    const pos = (e) => {
        const r = cv.current.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    };
    return (<div>
      <div className="bar">
        {COLORS.map((c) => (<button key={c} aria-label={'Color ' + c} onClick={() => setColor(c)} style={{ width: 26, height: 26, padding: 0, borderRadius: 99, background: c, outline: color === c ? '2px solid #fff' : 'none' }}/>))}
        <span style={{ flex: 1 }}/>
        <button onClick={() => doc?.getArray('strokes').delete(0, doc.getArray('strokes').length)}>Clear</button>
      </div>
      <canvas ref={cv} className="board" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); cur.current = pos(e); draw(); }} onPointerMove={(e) => { if (cur.current) {
        cur.current.push(...pos(e));
        draw();
    } }} onPointerUp={() => {
            if (cur.current && doc)
                doc.getArray('strokes').push([{ c: colorRef.current, p: cur.current }]);
            cur.current = null;
        }}/>
    </div>);
}
