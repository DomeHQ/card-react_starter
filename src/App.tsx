import { useEffect, useRef, useState, useCallback } from "react";

type Tab = "clock" | "alarm" | "timer" | "stopwatch";
type ToneType = "beep" | "chime" | "bell" | "digital";

interface Alarm {
  id: string;
  time: string;
  label: string;
  tone: ToneType;
  enabled: boolean;
}

function playTone(type: ToneType, duration = 1.5) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const configs: Record<ToneType, () => void> = {
    beep: () => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "square"; osc.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(); osc.stop(ctx.currentTime + duration);
    },
    chime: () => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
        g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.2 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.6);
        osc.start(ctx.currentTime + i * 0.2); osc.stop(ctx.currentTime + i * 0.2 + 0.7);
      });
    },
    bell: () => {
      [440, 880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        g.gain.setValueAtTime(0.3 / (i + 1), ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + i * 0.3);
        osc.start(); osc.stop(ctx.currentTime + duration + i * 0.3);
      });
    },
    digital: () => {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sawtooth"; osc.frequency.value = 1200;
        g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.3);
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.3 + 0.15);
        osc.start(ctx.currentTime + i * 0.3); osc.stop(ctx.currentTime + i * 0.3 + 0.2);
      }
    },
  };
  configs[type]();
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatMs(ms: number) {
  const t = Math.floor(ms / 1000);
  return { hours: Math.floor(t / 3600), minutes: Math.floor((t % 3600) / 60), seconds: t % 60, centis: Math.floor((ms % 1000) / 10) };
}

function AnalogClock({ h, m, s }: { h: number; m: number; s: number }) {
  const size = 220, cx = 110, cy = 110, r = 98;
  const hand = (angle: number, len: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + len * Math.cos(rad), y: cy + len * Math.sin(rad) };
  };
  const sec = hand(s * 6, r * 0.82), min = hand(m * 6 + s * 0.1, r * 0.72), hr = hand((h % 12) * 30 + m * 0.5, r * 0.52);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: "drop-shadow(0 0 24px rgba(251,191,36,0.25))" }}>
      <circle cx={cx} cy={cy} r={r} fill="#0c0a09" stroke="#292524" strokeWidth="2" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 - 90) * Math.PI / 180, major = i % 5 === 0;
        const inner = major ? r - 14 : r - 7;
        return <line key={i} x1={cx + inner * Math.cos(a)} y1={cy + inner * Math.sin(a)} x2={cx + (r - 2) * Math.cos(a)} y2={cy + (r - 2) * Math.sin(a)} stroke={major ? "#a8a29e" : "#44403c"} strokeWidth={major ? 2.5 : 1} strokeLinecap="round" />;
      })}
      {[12, 3, 6, 9].map(n => {
        const a = ((n === 12 ? 0 : n * 30) - 90) * Math.PI / 180, d = r - 28;
        return <text key={n} x={cx + d * Math.cos(a)} y={cy + d * Math.sin(a) + 5} textAnchor="middle" fill="#d6d3d1" fontSize="14" fontFamily="Georgia, serif" fontWeight="bold">{n}</text>;
      })}
      <line x1={cx} y1={cy} x2={hr.x} y2={hr.y} stroke="#fafaf9" strokeWidth="5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={min.x} y2={min.y} stroke="#d6d3d1" strokeWidth="3.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={sec.x} y2={sec.y} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#fbbf24" /><circle cx={cx} cy={cy} r={2.5} fill="#0c0a09" />
    </svg>
  );
}

function ClockTab() {
  const [now, setNow] = useState(new Date());
  const [tz, setTz] = useState({ label: "IST", offset: 5.5 });
  const zones = [{ label: "IST", offset: 5.5 }, { label: "UTC", offset: 0 }, { label: "EST", offset: -5 }, { label: "PST", offset: -8 }];
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const zoned = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + tz.offset * 3600000);
  const h = zoned.getHours(), m = zoned.getMinutes(), s = zoned.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {zones.map(z => <button key={z.label} onClick={() => setTz(z)} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${tz.label === z.label ? "#fbbf24" : "#44403c"}`, background: tz.label === z.label ? "#fbbf24" : "transparent", color: tz.label === z.label ? "#0c0a09" : "#78716c", fontSize: 12, fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>{z.label}</button>)}
      </div>
      <AnalogClock h={h12} m={m} s={s} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, fontWeight: "bold", fontFamily: "Georgia, serif", color: "#fafaf9" }}>
          {pad(h12)}:{pad(m)}:{pad(s)} <span style={{ fontSize: 22, color: "#fbbf24" }}>{ampm}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#78716c" }}>{zoned.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
      </div>
    </div>
  );
}

function AlarmTab() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newTime, setNewTime] = useState("07:00");
  const [newLabel, setNewLabel] = useState("");
  const [newTone, setNewTone] = useState<ToneType>("chime");
  const [ringing, setRinging] = useState<string | null>(null);
  const tones: ToneType[] = ["beep", "chime", "bell", "digital"];
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      alarms.forEach(a => { if (a.enabled && a.time === current && now.getSeconds() === 0) { setRinging(a.id); playTone(a.tone, 3); } });
    }, 1000);
    return () => clearInterval(id);
  }, [alarms]);
  const addAlarm = () => { setAlarms(prev => [...prev, { id: Date.now().toString(), time: newTime, label: newLabel || "Alarm", tone: newTone, enabled: true }]); setNewLabel(""); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      {ringing && <div style={{ background: "#fbbf24", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#0c0a09", fontWeight: "bold" }}>🔔 {alarms.find(a => a.id === ringing)?.label}</span>
        <button onClick={() => setRinging(null)} style={{ background: "#0c0a09", color: "#fbbf24", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold" }}>Dismiss</button>
      </div>}
      <div style={{ background: "#1c1917", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ color: "#a8a29e", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase" }}>New Alarm</div>
        <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ background: "#292524", border: "none", borderRadius: 8, color: "#fafaf9", padding: "10px 14px", fontSize: 28, fontFamily: "monospace", width: "100%", boxSizing: "border-box" }} />
        <input type="text" placeholder="Label (optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ background: "#292524", border: "none", borderRadius: 8, color: "#fafaf9", padding: "10px 14px", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8 }}>
          {tones.map(t => <button key={t} onClick={() => { setNewTone(t); playTone(t, 0.8); }} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: `1px solid ${newTone === t ? "#fbbf24" : "#44403c"}`, background: newTone === t ? "#292524" : "transparent", color: newTone === t ? "#fbbf24" : "#78716c", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{t}</button>)}
        </div>
        <button onClick={addAlarm} style={{ background: "#fbbf24", color: "#0c0a09", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: "bold", cursor: "pointer" }}>+ Add Alarm</button>
      </div>
      {alarms.length === 0 && <div style={{ textAlign: "center", color: "#57534e", fontSize: 14, padding: 20 }}>No alarms set</div>}
      {alarms.map(a => (
        <div key={a.id} style={{ background: "#1c1917", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: a.enabled ? 1 : 0.5 }}>
          <div><div style={{ fontSize: 28, fontFamily: "monospace", color: "#fafaf9", fontWeight: "bold" }}>{a.time}</div><div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>{a.label} · {a.tone}</div></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setAlarms(prev => prev.map(x => x.id === a.id ? { ...x, enabled: !x.enabled } : x))} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: a.enabled ? "#fbbf24" : "#44403c", position: "relative" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: a.enabled ? 23 : 3, transition: "left 0.2s" }} />
            </button>
            <button onClick={() => setAlarms(prev => prev.filter(x => x.id !== a.id))} style={{ background: "none", border: "none", color: "#57534e", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimerTab() {
  const [inputH, setInputH] = useState(0), [inputM, setInputM] = useState(5), [inputS, setInputS] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [tone, setTone] = useState<ToneType>("bell");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tones: ToneType[] = ["beep", "chime", "bell", "digital"];
  const totalMs = (inputH * 3600 + inputM * 60 + inputS) * 1000;
  useEffect(() => {
    if (running && remaining !== null && remaining > 0) {
      intervalRef.current = setInterval(() => setRemaining(prev => { if (!prev || prev <= 1000) { setRunning(false); playTone(tone, 3); return 0; } return prev - 1000; }), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);
  const display = remaining !== null ? formatMs(remaining) : { hours: inputH, minutes: inputM, seconds: inputS, centis: 0 };
  const progress = remaining !== null && totalMs > 0 ? (totalMs - remaining) / totalMs : 0;
  const spinBtn: React.CSSProperties = { background: "#292524", border: "none", color: "#a8a29e", width: 36, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 12 };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg width={200} height={200} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={100} cy={100} r={88} fill="none" stroke="#292524" strokeWidth="10" />
          <circle cx={100} cy={100} r={88} fill="none" stroke="#fbbf24" strokeWidth="10" strokeDasharray={`${2 * Math.PI * 88}`} strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontFamily: "monospace", fontWeight: "bold", color: remaining === 0 ? "#fbbf24" : "#fafaf9" }}>{pad(display.hours)}:{pad(display.minutes)}:{pad(display.seconds)}</div>
          {remaining === 0 && <div style={{ color: "#fbbf24", fontSize: 13 }}>Time's up!</div>}
        </div>
      </div>
      {!running && remaining === null && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {([["H", inputH, setInputH, 23], ["M", inputM, setInputM, 59], ["S", inputS, setInputS, 59]] as any[]).map(([label, val, setter, max]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <button onClick={() => setter(Math.min(val + 1, max))} style={spinBtn}>▲</button>
              <div style={{ background: "#1c1917", borderRadius: 8, padding: "8px 16px", fontFamily: "monospace", fontSize: 28, color: "#fafaf9", minWidth: 60, textAlign: "center" }}>{pad(val)}</div>
              <button onClick={() => setter(Math.max(val - 1, 0))} style={spinBtn}>▼</button>
              <div style={{ fontSize: 11, color: "#57534e" }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {tones.map(t => <button key={t} onClick={() => { setTone(t); playTone(t, 0.6); }} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${tone === t ? "#fbbf24" : "#44403c"}`, background: tone === t ? "#292524" : "transparent", color: tone === t ? "#fbbf24" : "#78716c", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{t}</button>)}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {!running ? <button onClick={() => { if (remaining === null || remaining === 0) setRemaining(totalMs); setRunning(true); }} style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: "bold", cursor: "pointer", background: "#fbbf24", color: "#0c0a09" }}>{remaining && remaining > 0 ? "Resume" : "Start"}</button>
          : <button onClick={() => setRunning(false)} style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: "bold", cursor: "pointer", background: "#292524", color: "#fafaf9" }}>Pause</button>}
        <button onClick={() => { setRunning(false); setRemaining(null); }} style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: "bold", cursor: "pointer", background: "#292524", color: "#78716c" }}>Reset</button>
      </div>
    </div>
  );
}

function StopwatchTab() {
  const [elapsed, setElapsed] = useState(0), [running, setRunning] = useState(false), [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0), accRef = useRef(0), rafRef = useRef(0);
  const tick = useCallback(() => { setElapsed(accRef.current + Date.now() - startRef.current); rafRef.current = requestAnimationFrame(tick); }, []);
  const start = () => { startRef.current = Date.now(); setRunning(true); rafRef.current = requestAnimationFrame(tick); };
  const pause = () => { accRef.current += Date.now() - startRef.current; setRunning(false); cancelAnimationFrame(rafRef.current); };
  const reset = () => { cancelAnimationFrame(rafRef.current); setRunning(false); setElapsed(0); setLaps([]); accRef.current = 0; };
  const { hours, minutes, seconds, centis } = formatMs(elapsed);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ textAlign: "center", background: "#1c1917", borderRadius: 20, padding: "32px 40px" }}>
        <div style={{ fontSize: 52, fontFamily: "monospace", fontWeight: "bold", color: "#fafaf9" }}>
          {hours > 0 && <span>{pad(hours)}:</span>}{pad(minutes)}:{pad(seconds)}<span style={{ fontSize: 30, color: "#fbbf24" }}>.{pad(centis)}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {!running ? <button onClick={start} style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: "bold", cursor: "pointer", background: "#fbbf24", color: "#0c0a09" }}>{elapsed > 0 ? "Resume" : "Start"}</button>
          : <button onClick={pause} style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: "bold", cursor: "pointer", background: "#292524", color: "#fafaf9" }}>Pause</button>}
        {running && <button onClick={() => setLaps(prev => [elapsed, ...prev])} style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: "bold", cursor: "pointer", background: "#292524", color: "#fbbf24" }}>Lap</button>}
        {!running && elapsed > 0 && <button onClick={reset} style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: "bold", cursor: "pointer", background: "#292524", color: "#78716c" }}>Reset</button>}
      </div>
      {laps.length > 0 && <div style={{ width: "100%", maxHeight: 200, overflowY: "auto" }}>
        {laps.map((l, i) => {
          const { hours: lh, minutes: lm, seconds: ls, centis: lc } = formatMs(l);
          const { hours: dh, minutes: dm, seconds: ds, centis: dc } = formatMs(l - (laps[i + 1] ?? 0));
          return <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", borderBottom: "1px solid #292524" }}>
            <span style={{ color: "#78716c", fontSize: 13 }}>Lap {laps.length - i}</span>
            <span style={{ color: "#a8a29e", fontFamily: "monospace", fontSize: 13 }}>+{dh > 0 ? pad(dh) + ":" : ""}{pad(dm)}:{pad(ds)}.{pad(dc)}</span>
            <span style={{ color: "#fafaf9", fontFamily: "monospace", fontSize: 13, fontWeight: "bold" }}>{lh > 0 ? pad(lh) + ":" : ""}{pad(lm)}:{pad(ls)}.{pad(lc)}</span>
          </div>;
        })}
      </div>}
    </div>
  );
}

const TABS = [{ id: "clock" as Tab, label: "Clock", icon: "🕐" }, { id: "alarm" as Tab, label: "Alarm", icon: "🔔" }, { id: "timer" as Tab, label: "Timer", icon: "⏱" }, { id: "stopwatch" as Tab, label: "Stopwatch", icon: "⏲" }];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("clock");
  return (
    <div style={{ minHeight: "100vh", background: "#0c0a09", color: "#fafaf9", display: "flex", flexDirection: "column", fontFamily: "Georgia, serif" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #1c1917", background: "#0c0a09", position: "sticky", top: 0, zIndex: 10 }}>
        {TABS.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "14px 4px 12px", border: "none", background: "none", color: activeTab === tab.id ? "#fbbf24" : "#57534e", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderBottom: activeTab === tab.id ? "2px solid #fbbf24" : "2px solid transparent" }}>
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" }}>{tab.label}</span>
        </button>)}
      </div>
      <div style={{ flex: 1, padding: "24px 16px", overflowY: "auto" }}>
        {activeTab === "clock" && <ClockTab />}
        {activeTab === "alarm" && <AlarmTab />}
        {activeTab === "timer" && <TimerTab />}
        {activeTab === "stopwatch" && <StopwatchTab />}
      </div>
    </div>
  );
}