import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zondhwwrleijbpaziujl.supabase.co";
const SUPABASE_KEY = "sb_publishable_FPy29ZX2iXjEmODgOOarRA_zjws9XYp";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const STAFF_PASSWORD = "1234";

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
async function fetchStats(sessionId) {
  const { data } = await supabase.from("tickets").select("*").eq("session_id", sessionId);
  if (!data) return { total: 0, done: 0, waiting: 0, skipped: 0 };
  return {
    total: data.length,
    done: data.filter(t => t.status === "done").length,
    waiting: data.filter(t => t.status === "waiting").length,
    skipped: data.filter(t => t.status === "skipped").length,
  };
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

// ─── Staff Login ───────────────────────────────────────────────────────────────
function StaffLogin({ onLogin }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (pass === STAFF_PASSWORD) { onLogin(); }
    else { setError("كلمة المرور خاطئة ❌"); }
  };

  return (
    <div style={{ maxWidth: "360px", margin: "80px auto", padding: "24px 16px" }}>
      <div style={{ background: "rgba(30,27,75,0.9)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", padding: "32px 24px", textAlign: "center", animation: "fadeIn 0.4s ease" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔐</div>
        <h2 style={{ color: "#e2e8f0", fontFamily: "'Cairo',sans-serif", margin: "0 0 24px", fontSize: "20px" }}>دخول الموظف</h2>
        <input
          type="password"
          placeholder="أدخل كلمة المرور"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#e2e8f0", fontSize: "16px", fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box", textAlign: "center", marginBottom: "12px", direction: "ltr" }}
        />
        {error && <div style={{ color: "#f87171", fontFamily: "'Cairo',sans-serif", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
        <button onClick={handleLogin} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#ec4899)", color: "#fff", fontSize: "16px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: "pointer" }}>
          دخول ✅
        </button>
      </div>
    </div>
  );
}

// ─── Client View ──────────────────────────────────────────────────────────────
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
< truncated lines 131-280 >
          </div>
        ))}
      </div>

      <StatusBar current={current} queueLen={queue.length} />

      {/* Currently serving */}
      <div style={{ background: flash ? "rgba(16,185,129,0.15)" : "rgba(30,27,75,0.9)", border: `2px solid ${flash ? "#10b981" : "rgba(99,102,241,0.3)"}`, borderRadius: "20px", padding: "24px", marginBottom: "16px", textAlign: "center", transition: "all 0.3s" }}>
        <div style={{ color: "#94a3b8", fontFamily: "'Cairo',sans-serif", fontSize: "12px", marginBottom: "6px" }}>يُخدم الآن</div>
        <div style={{ fontSize: "72px", fontWeight: "900", fontFamily: "'Bebas Neue',cursive", lineHeight: 1, background: current ? "linear-gradient(135deg,#10b981,#6ee7b7)" : "none", WebkitBackgroundClip: current ? "text" : "unset", WebkitTextFillColor: current ? "transparent" : "#334155", color: current ? undefined : "#334155" }}>
          {current ? String(current.ticket_number).padStart(3, "0") : "---"}
        </div>
        {current?.name && <div style={{ color: "#6ee7b7", fontFamily: "'Cairo',sans-serif", fontSize: "14px", marginTop: "4px" }}>👤 {current.name}</div>}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button onClick={handleNext} disabled={queue.length === 0 || loading} style={{ flex: 2, padding: "18px", borderRadius: "14px", border: "none", background: queue.length === 0 ? "rgba(51,65,85,0.5)" : "linear-gradient(135deg,#10b981,#059669)", color: queue.length === 0 ? "#475569" : "#fff", fontSize: "16px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: queue.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span>▶</span> {loading ? "..." : queue.length === 0 ? "الطابور فارغ" : `التالي (${queue.length})`}
        </button>
        <button onClick={handleSkip} disabled={queue.length === 0 || loading} style={{ flex: 1, padding: "18px", borderRadius: "14px", border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)", color: queue.length === 0 ? "#475569" : "#f59e0b", fontSize: "14px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: queue.length === 0 ? "not-allowed" : "pointer" }}>
          تخطي ⏭
        </button>
      </div>

      {/* Queue list */}
      <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
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

      {/* Close Queue Button */}
      {!confirmClose ? (
        <button onClick={() => setConfirmClose(true)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "13px" }}>
          🔒 إغلاق الطابور لهذا اليوم
        </button>
      ) : (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
          <div style={{ color: "#f87171", fontFamily: "'Cairo',sans-serif", fontSize: "14px", marginBottom: "12px" }}>هل أنت متأكد من إغلاق الطابور؟</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setConfirmClose(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>إلغاء</button>
            <button onClick={handleCloseQueue} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: "700" }}>تأكيد الإغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("client");
  const [session, setSession] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [ready, setReady] = useState(false);
  const [staffAuthed, setStaffAuthed] = useState(false);

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
        {view === "client" ? (
          <ClientView session={session} queue={queue} current={current} />
        ) : staffAuthed ? (
          <StaffView session={session} queue={queue} current={current} reload={() => loadData()} onLogout={() => setStaffAuthed(false)} />
        ) : (
          <StaffLogin onLogin={() => setStaffAuthed(true)} />
        )}
      </div>
      <div style={{ position: "fixed", bottom: "14px", left: "50%", transform: "translateX(-50%)", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", padding: "5px 14px", color: "#6ee7b7", fontSize: "11px", fontFamily: "'Cairo',sans-serif", backdropFilter: "blur(10px)", zIndex: 20, whiteSpace: "nowrap" }}>
        ✅ متصل بـ Supabase • Real-time مفعّل
      </div>
    </div>
  );
}
