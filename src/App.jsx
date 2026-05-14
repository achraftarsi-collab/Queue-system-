import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zondhwwrleijbpaziujl.supabase.co";
const SUPABASE_KEY = "sb_publishable_FPy29ZX2iXjEmODgOOarRA_zjws9XYp";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getOrCreateSession() {
  const today = new Date().toISOString().split("T")[0];
  let { data } = await supabase.from("sessions").select("*").eq("date", today).single();
  if (!data) {
    const { data: newSession } = await supabase.from("sessions").insert({ date: today, is_active: true }).select().single();
    return newSession;
  }
  return data;
}

async function fetchQueue(sessionId) {
  const { data } = await supabase.from("tickets").select("*").eq("session_id", sessionId).eq("status", "waiting").order("ticket_number", { ascending: true });
  return data || [];
}

async function fetchCurrent(sessionId) {
  const { data } = await supabase.from("tickets").select("*").eq("session_id", sessionId).eq("status", "serving").order("ticket_number", { ascending: false }).limit(1).single();
  return data || null;
}

async function fetchNextNumber(sessionId) {
  const { data } = await supabase.from("tickets").select("ticket_number").eq("session_id", sessionId).order("ticket_number", { ascending: false }).limit(1).single();
  return data ? data.ticket_number + 1 : 1;
}

function ParticlesBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%",
          background: `rgba(${i % 2 === 0 ? "99,102,241" : "236,72,153"},0.06)`,
          width: `${50 + i * 20}px`, height: `${50 + i * 20}px`,
          top: `${Math.sin(i * 1.3) * 40 + 50}%`,
          left: `${Math.cos(i * 0.9) * 40 + 50}%`,
          transform: "translate(-50%,-50%)",
          animation: `float${i % 3} ${7 + i * 0.8}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`,
        }} />
      ))}
      <style>{`
        @keyframes float0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-58%) scale(1.08)}}
        @keyframes float1{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-58%,-50%) scale(0.94)}}
        @keyframes float2{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-44%,-56%) scale(1.05)}}
        @keyframes shimmer{0%{background-position:0% 0}100%{background-position:200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)}50%{box-shadow:0 0 0 12px rgba(99,102,241,0)}}
      `}</style>
    </div>
  );
}

function StatusBar({ current, queueLen }) {
  return (
    <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "14px", padding: "14px 20px", marginBottom: "24px", display: "flex", justifyContent: "space-around", textAlign: "center" }}>
      {[
        { label: "يُخدم الآن", value: current ? String(current.ticket_number).padStart(3, "0") : "---", color: "#6366f1" },
        { label: "في الانتظار", value: queueLen, color: "#ec4899" },
        { label: "وقت الانتظار", value: `~${queueLen * 5}د`, color: "#10b981" },
      ].map((s, i) => (
        <div key={i}>
          <div style={{ color: s.color, fontSize: "26px", fontWeight: "800", fontFamily: "'Bebas Neue',cursive" }}>{s.value}</div>
          <div style={{ color: "#94a3b8", fontSize: "11px", fontFamily: "'Cairo',sans-serif" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function ClientView({ session, queue, current }) {
  const [step, setStep] = useState("home");
  const [myTicket, setMyTicket] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", notif: "whatsapp" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const liveTicket = myTicket ? queue.find(t => t.id === myTicket.id) : null;
  const position = liveTicket ? queue.indexOf(liveTicket) + 1 : null;

  const handleSubmit = async () => {
    if (!form.phone && form.notif !== "none") { setError("أدخل رقم الهاتف لتفعيل الإشعار"); return; }
    setLoading(true); setError("");
    try {
      const nextNum = await fetchNextNumber(session.id);
      const { data, error: err } = await supabase.from("tickets").insert({
        session_id: session.id, ticket_number: nextNum,
        name: form.name, phone: form.phone, notif_method: form.notif,
        status: "waiting", position: queue.length + 1,
      }).select().single();
      if (err) throw err;
      setMyTicket(data); setStep("ticket");
    } catch { setError("حدث خطأ، حاول مرة أخرى"); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "440px", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "44px", marginBottom: "6px" }}>🎫</div>
        <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "40px", background: "linear-gradient(135deg,#a5b4fc,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>نظام الطابور</h1>
        <p style={{ color: "#64748b", fontFamily: "'Cairo',sans-serif", fontSize: "13px", margin: "4px 0 0" }}>احجز مكانك وانتظر بارتياح</p>
      </div>
      <StatusBar current={current} queueLen={queue.length} />
      {step === "home" && (
        <button onClick={() => setStep("form")} style={{ width: "100%", padding: "20px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg,#6366f1,#ec4899)", color: "#fff", fontSize: "20px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 32px rgba(99,102,241,0.4)", animation: "pulse 2s infinite" }}>
          🎫 خذ رقمًا الآن
        </button>
      )}
      {step === "form" && (
        <div style={{ background: "rgba(30,27,75,0.85)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", padding: "24px", backdropFilter: "blur(20px)" }}>
          <h2 style={{ color: "#e2e8f0", fontFamily: "'Cairo',sans-serif", margin: "0 0 18px", fontSize: "17px", textAlign: "right" }}>بياناتك للإشعار</h2>
          {[{ key: "name", label: "الاسم (اختياري)", placeholder: "مثال: محمد", type: "text" }, { key: "phone", label: "رقم الهاتف / واتساب", placeholder: "+212612345678", type: "tel" }].map(f => (
            <div key={f.key} style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#a5b4fc", fontSize: "12px", marginBottom: "5px", fontFamily: "'Cairo',sans-serif", textAlign: "right" }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#e2e8f0", fontSize: "14px", fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box", direction: "rtl" }} />
            </div>
          ))}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", color: "#a5b4fc", fontSize: "12px", marginBottom: "7px", fontFamily: "'Cairo',sans-serif", textAlign: "right" }}>طريقة الإشعار</label>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              {[{ v: "whatsapp", icon: "💬", label: "واتساب" }, { v: "sms", icon: "📱", label: "SMS" }, { v: "none", icon: "🚫", label: "بدون" }].map(opt => (
                <button key={opt.v} onClick={() => setForm(p => ({ ...p, notif: opt.v }))} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid", borderColor: form.notif === opt.v ? "#6366f1" : "rgba(99,102,241,0.2)", background: form.notif === opt.v ? "rgba(99,102,241,0.25)" : "transparent", color: form.notif === opt.v ? "#a5b4fc" : "#64748b", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "12px" }}>{opt.icon} {opt.label}</button>
              ))}
            </div>
          </div>
          {error && <div style={{ color: "#f87171", fontFamily: "'Cairo',sans-serif", fontSize: "13px", marginBottom: "12px", textAlign: "right" }}>⚠️ {error}</div>}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep("home")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(99,102,241,0.3)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>رجوع</button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#ec4899)", color: "#fff", fontSize: "14px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: loading ? "wait" : "pointer" }}>{loading ? "جاري الحجز..." : "✅ تأكيد وأخذ الرقم"}</button>
          </div>
        </div>
      )}
      {step === "ticket" && myTicket && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81,#1e1b4b)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "24px", padding: "36px 28px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#6366f1,#ec4899,#6366f1)", backgroundSize: "200%", animation: "shimmer 3s linear infinite" }} />
            <div style={{ color: "#a5b4fc", fontSize: "12px", letterSpacing: "3px", marginBottom: "6px", fontFamily: "'Cairo',sans-serif" }}>رقم تذكرتك</div>
            <div style={{ fontSize: "88px", fontWeight: "900", lineHeight: 1, background: "linear-gradient(135deg,#a5b4fc,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Bebas Neue',cursive", marginBottom: "20px" }}>
              {String(myTicket.ticket_number).padStart(3, "0")}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "20px" }}>
              <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "12px", padding: "10px 18px" }}>
                <div style={{ color: "#a5b4fc", fontSize: "10px", fontFamily: "'Cairo',sans-serif" }}>موقعك</div>
                <div style={{ color: "#fff", fontSize: "22px", fontFamily: "'Bebas Neue',cursive" }}>{liveTicket ? (position === 1 ? "🎯 أنت التالي" : `# ${position}`) : "✅ تمت خدمتك"}</div>
              </div>
              <div style={{ background: "rgba(236,72,153,0.15)", borderRadius: "12px", padding: "10px 18px" }}>
                <div style={{ color: "#f9a8d4", fontSize: "10px", fontFamily: "'Cairo',sans-serif" }}>الانتظار</div>
                <div style={{ color: "#fff", fontSize: "22px", fontFamily: "'Bebas Neue',cursive" }}>~{liveTicket ? (position - 1) * 5 : 0} دقيقة</div>
              </div>
            </div>
            {myTicket.phone && myTicket.notif_method !== "none" && (
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "9px 14px", color: "#6ee7b7", fontSize: "12px", fontFamily: "'Cairo',sans-serif" }}>
                {myTicket.notif_method === "whatsapp" ? "💬" : "📱"} سيتم إشعارك على {myTicket.phone} قبل دورك بـ 10 دقائق
              </div>
            )}
          </div>
          <button onClick={() => { setStep("home"); setMyTicket(null); setForm({ name: "", phone: "", notif: "whatsapp" }); }} style={{ width: "100%", marginTop: "14px", padding: "13px", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.3)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "13px" }}>+ أخذ رقم آخر</button>
        </div>
      )}
    </div>
  );
}

function StaffView({ session, queue, current, reload }) {
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleNext = async () => {
    if (queue.length === 0) return;
    setLoading(true);
    try {
      if (current) await supabase.from("tickets").update({ status: "done", served_at: new Date().toISOString() }).eq("id", current.id);
      const next = queue[0];
      await supabase.from("tickets").update({ status: "serving" }).eq("id", next.id);
      setFlash(true); setTimeout(() => setFlash(false), 700);
      await reload();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "36px" }}>🖥️</div>
        <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "34px", color: "#f1f5f9", margin: 0 }}>لوحة الموظف</h1>
      </div>
      <StatusBar current={current} queueLen={queue.length} />
      <div style={{ background: flash ? "rgba(16,185,129,0.15)" : "rgba(30,27,75,0.9)", border: `2px solid ${flash ? "#10b981" : "rgba(99,102,241,0.3)"}`, borderRadius: "20px", padding: "24px", marginBottom: "16px", textAlign: "center", transition: "all 0.3s" }}>
        <div style={{ color: "#94a3b8", fontFamily: "'Cairo',sans-serif", fontSize: "12px", marginBottom: "6px" }}>يُخدم الآن</div>
        <div style={{ fontSize: "72px", fontWeight: "900", fontFamily: "'Bebas Neue',cursive", lineHeight: 1, background: current ? "linear-gradient(135deg,#10b981,#6ee7b7)" : "none", WebkitBackgroundClip: current ? "text" : "unset", WebkitTextFillColor: current ? "transparent" : "#334155", color: current ? undefined : "#334155" }}>
          {current ? String(current.ticket_number).padStart(3, "0") : "---"}
        </div>
        {current?.name && <div style={{ color: "#6ee7b7", fontFamily: "'Cairo',sans-serif", fontSize: "14px", marginTop: "4px" }}>👤 {current.name}</div>}
      </div>
      <button onClick={handleNext} disabled={queue.length === 0 || loading} style={{ width: "100%", padding: "20px", borderRadius: "16px", border: "none", background: queue.length === 0 ? "rgba(51,65,85,0.5)" : "linear-gradient(135deg,#10b981,#059669)", color: queue.length === 0 ? "#475569" : "#fff", fontSize: "18px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: queue.length === 0 ? "not-allowed" : "pointer", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        <span>▶</span>
        {loading ? "جاري التحديث..." : queue.length === 0 ? "الطابور فارغ" : `استدعاء التالي (${queue.length} بالانتظار)`}
      </button>
      <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(99,102,241,0.15)", color: "#a5b4fc", fontFamily: "'Cairo',sans-serif", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
          <span>الرقم</span><span>الاسم</span><span>الإشعار</span>
        </div>
        {queue.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "#475569", fontFamily: "'Cairo',sans-serif" }}>لا يوجد أحد في الطابور</div>
        ) : (
          queue.slice(0, 8).map((t, i) => (
            <div key={t.id} style={{ padding: "11px 18px", borderBottom: "1px solid rgba(99,102,241,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", background: i === 0 ? "rgba(99,102,241,0.08)" : "transparent" }}>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "20px", color: i === 0 ? "#a5b4fc" : "#64748b" }}>{String(t.ticket_number).padStart(3, "0")}</div>
              <div style={{ color: i === 0 ? "#e2e8f0" : "#64748b", fontFamily: "'Cairo',sans-serif", fontSize: "13px" }}>
                {t.name || `زائر #${t.ticket_number}`}
                {i === 0 && <span style={{ color: "#a5b4fc", fontSize: "10px", marginRight: "6px" }}>← التالي</span>}
              </div>
              <div>{t.notif_method === "whatsapp" ? "💬" : t.notif_method === "sms" ? "📱" : "—"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("client");
  const [session, setSession] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [ready, setReady] = useState(false);

  const loadData = useCallback(async (sess) => {
    const s = sess || session;
    if (!s) return;
    const [q, c] = await Promise.all([fetchQueue(s.id), fetchCurrent(s.id)]);
    setQueue(q); setCurrent(c);
  }, [session]);

  useEffect(() => {
    (async () => {
      const sess = await getOrCreateSession();
      setSession(sess);
      await loadData(sess);
      setReady(true);
      const channel = supabase.channel("tickets-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `session_id=eq.${sess.id}` }, () => loadData(sess))
        .subscribe();
      return () => supabase.removeChannel(channel);
    })();
  }, []);

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#020617,#0f0f1a)", color: "#a5b4fc", fontFamily: "'Cairo',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎫</div>
        <div>جاري تحميل النظام...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#020617 0%,#0f0f1a 50%,#0a0a12 100%)", color: "#e2e8f0", fontFamily: "'Cairo',sans-serif", direction: "rtl", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <ParticlesBg />
      <nav style={{ position: "relative", zIndex: 10, borderBottom: "1px solid rgba(99,102,241,0.15)", background: "rgba(2,6,23,0.85)", backdropFilter: "blur(20px)", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", height: "56px" }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "20px", color: "#a5b4fc" }}>QUEUE PRO 🎫</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[{ v: "client", icon: "👤", label: "العميل" }, { v: "staff", icon: "🖥️", label: "الموظف" }].map(tab => (
            <button key={tab.v} onClick={() => setView(tab.v)} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid", borderColor: view === tab.v ? "#6366f1" : "rgba(99,102,241,0.2)", background: view === tab.v ? "rgba(99,102,241,0.2)" : "transparent", color: view === tab.v ? "#a5b4fc" : "#64748b", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "12px" }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </nav>
      <div style={{ position: "relative", zIndex: 5, paddingTop: "12px", paddingBottom: "60px" }}>
        {view === "client" ? <ClientView session={session} queue={queue} current={current} /> : <StaffView session={session} queue={queue} current={current} reload={() => loadData()} />}
      </div>
      <div style={{ position: "fixed", bottom: "14px", left: "50%", transform: "translateX(-50%)", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", padding: "5px 14px", color: "#6ee7b7", fontSize: "11px", fontFamily: "'Cairo',sans-serif", backdropFilter: "blur(10px)", zIndex: 20, whiteSpace: "nowrap" }}>
        ✅ متصل بـ Supabase • Real-time مفعّل
      </div>
    </div>
  );
}
