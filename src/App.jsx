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
    const { data: s } = await supabase.from("sessions").insert({ date: today, is_active: true }).select().single();
    return s;
  }
  return data;
}
async function fetchQueue(sid) {
  const { data } = await supabase.from("tickets").select("*").eq("session_id", sid).eq("status", "waiting").order("ticket_number", { ascending: true });
  return data || [];
}
async function fetchCurrent(sid) {
  const { data } = await supabase.from("tickets").select("*").eq("session_id", sid).eq("status", "serving").order("ticket_number", { ascending: false }).limit(1).single();
  return data || null;
}
async function fetchNextNumber(sid) {
  const { data } = await supabase.from("tickets").select("ticket_number").eq("session_id", sid).order("ticket_number", { ascending: false }).limit(1).single();
  return data ? data.ticket_number + 1 : 1;
}
async function fetchStats(sid) {
  const { data } = await supabase.from("tickets").select("status").eq("session_id", sid);
  if (!data) return { total: 0, done: 0, waiting: 0 };
  return {
    total: data.length,
    done: data.filter(t => t.status === "done" || t.status === "skipped").length,
    waiting: data.filter(t => t.status === "waiting").length,
  };
}

function ParticlesBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", borderRadius: "50%", background: `rgba(${i % 2 === 0 ? "99,102,241" : "236,72,153"},0.05)`, width: `${60 + i * 22}px`, height: `${60 + i * 22}px`, top: `${Math.sin(i * 1.3) * 40 + 50}%`, left: `${Math.cos(i * 0.9) * 40 + 50}%`, transform: "translate(-50%,-50%)", animation: `fl${i % 3} ${8 + i * 0.7}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
      ))}
      <style>{`
        @keyframes fl0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-58%) scale(1.08)}}
        @keyframes fl1{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-58%,-50%) scale(0.94)}}
        @keyframes fl2{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-44%,-56%) scale(1.05)}}
        @keyframes shimmer{0%{background-position:0% 0}100%{background-position:200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)}50%{box-shadow:0 0 0 14px rgba(99,102,241,0)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}

function StatusBar({ current, queueLen }) {
  return (
    <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: "14px", padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-around", textAlign: "center" }}>
      {[{ label: "يُخدم الآن", value: current ? String(current.ticket_number).padStart(3, "0") : "---", color: "#6366f1" }, { label: "في الانتظار", value: queueLen, color: "#ec4899" }, { label: "وقت الانتظار", value: `~${queueLen * 5}د`, color: "#10b981" }].map((s, i) => (
        <div key={i}>
          <div style={{ color: s.color, fontSize: "24px", fontWeight: "800", fontFamily: "'Bebas Neue',cursive" }}>{s.value}</div>
          <div style={{ color: "#64748b", fontSize: "10px", fontFamily: "'Cairo',sans-serif" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function StaffLogin({ onLogin }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  return (
    <div style={{ maxWidth: "340px", margin: "60px auto", padding: "16px", animation: "fadeIn 0.4s ease" }}>
      <div style={{ background: "rgba(15,10,40,0.95)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: "24px", padding: "36px 28px", textAlign: "center", backdropFilter: "blur(24px)" }}>
        <div style={{ fontSize: "52px", marginBottom: "10px" }}>🔐</div>
        <h2 style={{ color: "#e2e8f0", fontFamily: "'Cairo',sans-serif", margin: "0 0 6px", fontSize: "22px" }}>دخول الموظف</h2>
        <p style={{ color: "#475569", fontFamily: "'Cairo',sans-serif", fontSize: "13px", margin: "0 0 24px" }}>أدخل كلمة المرور للمتابعة</p>
        <input type="password" placeholder="••••" value={pass} onChange={e => { setPass(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && (pass === STAFF_PASSWORD ? onLogin() : setError("كلمة المرور خاطئة ❌"))}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(99,102,241,0.3)"}`, color: "#e2e8f0", fontSize: "20px", fontFamily: "monospace", outline: "none", textAlign: "center", marginBottom: "10px", letterSpacing: "6px" }} />
        {error && <div style={{ color: "#f87171", fontFamily: "'Cairo',sans-serif", fontSize: "13px", marginBottom: "10px" }}>{error}</div>}
        <button onClick={() => pass === STAFF_PASSWORD ? onLogin() : setError("كلمة المرور خاطئة ❌")}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#ec4899)", color: "#fff", fontSize: "16px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: "pointer" }}>
          دخول ✅
        </button>
      </div>
    </div>
  );
}

function ClientView({ session, queue, current }) {
  const [step, setStep] = useState("home");
  const [myTicket, setMyTicket] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", notif: "whatsapp" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    const saved = localStorage.getItem(`ticket_${session.id}`);
    if (saved) { try { const t = JSON.parse(saved); setMyTicket(t); setStep("ticket"); } catch {} }
  }, [session]);

  const liveTicket = myTicket ? queue.find(t => t.id === myTicket.id) : null;
  const position = liveTicket ? queue.indexOf(liveTicket) + 1 : null;
  const isServing = myTicket && current && current.id === myTicket.id;
  const isDone = myTicket && !liveTicket && !isServing;

  const handleSubmit = async () => {
    if (!form.phone && form.notif !== "none") { setError("أدخل رقم الهاتف لتفعيل الإشعار"); return; }
    setLoading(true); setError("");
    try {
      const nextNum = await fetchNextNumber(session.id);
      const { data, error: err } = await supabase.from("tickets").insert({ session_id: session.id, ticket_number: nextNum, name: form.name, phone: form.phone, notif_method: form.notif, status: "waiting", position: queue.length + 1 }).select().single();
      if (err) throw err;
      setMyTicket(data);
      localStorage.setItem(`ticket_${session.id}`, JSON.stringify(data));
      setStep("ticket");
    } catch { setError("حدث خطأ، حاول مرة أخرى"); }
    setLoading(false);
  };

  const handleReset = () => {
    localStorage.removeItem(`ticket_${session.id}`);
    setMyTicket(null); setForm({ name: "", phone: "", notif: "whatsapp" }); setStep("home");
  };

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "40px", marginBottom: "6px" }}>🎫</div>
        <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "38px", background: "linear-gradient(135deg,#a5b4fc,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>نظام الطابور</h1>
        <p style={{ color: "#475569", fontFamily: "'Cairo',sans-serif", fontSize: "13px", margin: "4px 0 0" }}>احجز مكانك وانتظر بارتياح</p>
      </div>
      <StatusBar current={current} queueLen={queue.length} />
      {step === "home" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <button onClick={() => setStep("form")} style={{ width: "100%", padding: "22px", borderRadius: "18px", border: "none", background: "linear-gradient(135deg,#6366f1,#ec4899)", color: "#fff", fontSize: "22px", fontFamily: "'Cairo',sans-serif", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 36px rgba(99,102,241,0.45)", animation: "pulse 2.5s infinite" }}>🎫 خذ رقمًا الآن</button>
          {queue.length > 0 && <div style={{ marginTop: "14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "12px", padding: "12px 16px", textAlign: "center" }}><span style={{ color: "#94a3b8", fontFamily: "'Cairo',sans-serif", fontSize: "13px" }}>⏳ يوجد <strong style={{ color: "#a5b4fc" }}>{queue.length}</strong> شخص — الانتظار ~<strong style={{ color: "#10b981" }}>{queue.length * 5}</strong> دقيقة</span></div>}
        </div>
      )}
      {step === "form" && (
        <div style={{ background: "rgba(15,10,40,0.9)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", padding: "24px", backdropFilter: "blur(20px)", animation: "fadeIn 0.3s ease" }}>
          <h2 style={{ color: "#e2e8f0", fontFamily: "'Cairo',sans-serif", margin: "0 0 18px", fontSize: "17px", textAlign: "right" }}>بياناتك للإشعار</h2>
          {[{ key: "name", label: "الاسم (اختياري)", placeholder: "مثال: محمد", type: "text" }, { key: "phone", label: "رقم الهاتف / واتساب", placeholder: "+212612345678", type: "tel" }].map(f => (
            <div key={f.key} style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#a5b4fc", fontSize: "12px", marginBottom: "5px", fontFamily: "'Cairo',sans-serif", textAlign: "right" }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#e2e8f0", fontSize: "15px", fontFamily: "'Cairo',sans-serif", outline: "none", direction: "rtl" }} />
            </div>
          ))}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", color: "#a5b4fc", fontSize: "12px", marginBottom: "7px", fontFamily: "'Cairo',sans-serif", textAlign: "right" }}>طريقة الإشعار</label>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              {[{ v: "whatsapp", icon: "💬", label: "واتساب" }, { v: "sms", icon: "📱", label: "SMS" }, { v: "none", icon: "🚫", label: "بدون" }].map(opt => (
                <button key={opt.v} onClick={() => setForm(p => ({ ...p, notif: opt.v }))} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid", borderColor: form.notif === opt.v ? "#6366f1" : "rgba(99,102,241,0.2)", background: form.notif === opt.v ? "rgba(99,102,241,0.25)" : "transparent", color: form.notif === opt.v ? "#a5b4fc" : "#64748b", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "12px" }}>{opt.icon} {opt.label}</button>
              ))}
            </div>
          </div>
          {error && <div style={{ color: "#f87171", fontFamily: "'Cairo',sans-serif", fontSize: "13px", marginBottom: "12px", textAlign: "right" }}>⚠️ {error}</div>}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep("home")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(99,102,241,0.25)", background: "transparent", color: "#64748b", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>رجوع</button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#ec4899)", color: "#fff", fontSize: "15px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: loading ? "wait" : "pointer" }}>{loading ? "⏳ جاري الحجز..." : "✅ تأكيد وأخذ الرقم"}</button>
          </div>
        </div>
      )}
      {step === "ticket" && myTicket && (
        <div style={{ animation: "popIn 0.4s ease" }}>
          <div style={{ background: "linear-gradient(135deg,#1e1b4b,#2d2a6e,#1e1b4b)", border: `1px solid ${isServing ? "rgba(16,185,129,0.6)" : "rgba(99,102,241,0.4)"}`, borderRadius: "24px", padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: isServing ? "linear-gradient(90deg,#10b981,#6ee7b7,#10b981)" : "linear-gradient(90deg,#6366f1,#ec4899,#6366f1)", backgroundSize: "200%", animation: "shimmer 3s linear infinite" }} />
            {isServing && <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "10px", padding: "8px 14px", marginBottom: "16px", color: "#6ee7b7", fontFamily: "'Cairo',sans-serif", fontSize: "14px", fontWeight: "700" }}>🎯 دورك الآن! توجه للخدمة</div>}
            {isDone && <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "10px", padding: "8px 14px", marginBottom: "16px", color: "#a5b4fc", fontFamily: "'Cairo',sans-serif", fontSize: "14px" }}>✅ تمت خدمتك — شكراً لزيارتك</div>}
            <div style={{ color: "#64748b", fontSize: "11px", letterSpacing: "3px", marginBottom: "4px", fontFamily: "'Cairo',sans-serif" }}>رقم تذكرتك</div>
            <div style={{ fontSize: "86px", fontWeight: "900", lineHeight: 1, background: isServing ? "linear-gradient(135deg,#10b981,#6ee7b7)" : "linear-gradient(135deg,#a5b4fc,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Bebas Neue',cursive", marginBottom: "18px" }}>
              {String(myTicket.ticket_number).padStart(3, "0")}
            </div>
            {!isDone && !isServing && liveTicket && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "16px" }}>
                <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "12px", padding: "10px 16px" }}>
                  <div style={{ color: "#64748b", fontSize: "10px", fontFamily: "'Cairo',sans-serif" }}>موقعك</div>
                  <div style={{ color: "#fff", fontSize: "20px", fontFamily: "'Bebas Neue',cursive" }}>{position === 1 ? "🎯 أنت التالي" : `# ${position}`}</div>
                </div>
                <div style={{ background: "rgba(236,72,153,0.15)", borderRadius: "12px", padding: "10px 16px" }}>
                  <div style={{ color: "#64748b", fontSize: "10px", fontFamily: "'Cairo',sans-serif" }}>الانتظار</div>
                  <div style={{ color: "#fff", fontSize: "20px", fontFamily: "'Bebas Neue',cursive" }}>~{(position - 1) * 5} د</div>
                </div>
              </div>
            )}
            {myTicket.phone && myTicket.notif_method !== "none" && !isDone && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", padding: "8px 14px", color: "#6ee7b7", fontSize: "12px", fontFamily: "'Cairo',sans-serif" }}>
                {myTicket.notif_method === "whatsapp" ? "💬" : "📱"} سيتم إشعارك على {myTicket.phone} قبل دورك بـ 10 دقائق
              </div>
            )}
          </div>
          <button onClick={handleReset} style={{ width: "100%", marginTop: "12px", padding: "13px", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.2)", background: "transparent", color: "#475569", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "13px" }}>+ أخذ رقم آخر</button>
        </div>
      )}
    </div>
  );
}

function StaffView({ session, queue, current, reload, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [stats, setStats] = useState({ total: 0, done: 0, waiting: 0 });
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => { fetchStats(session.id).then(setStats); }, [queue, current]);

  const handleNext = async () => {
    if (queue.length === 0) return;
    setLoading(true);
    try {
      if (current) await supabase.from("tickets").update({ status: "done", served_at: new Date().toISOString() }).eq("id", current.id);
      await supabase.from("tickets").update({ status: "serving" }).eq("id", queue[0].id);
      setFlash(true); setTimeout(() => setFlash(false), 800);
      await reload();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSkip = async () => {
    if (queue.length === 0) return;
    await supabase.from("tickets").update({ status: "skipped" }).eq("id", queue[0].id);
    await reload();
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 16px", animation: "fadeIn 0.4s ease" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "32px" }}>🖥️</div>
        <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "32px", color: "#f1f5f9", margin: "4px 0" }}>لوحة الموظف</h1>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[{ label: "إجمالي اليوم", value: stats.total, color: "#6366f1" }, { label: "تمت خدمتهم", value: stats.done, color: "#10b981" }, { label: "في الانتظار", value: stats.waiting, color: "#ec4899" }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: "12px", padding: "10px 6px", textAlign: "center" }}>
            <div style={{ color: s.color, fontSize: "26px", fontWeight: "800", fontFamily: "'Bebas Neue',cursive" }}>{s.value}</div>
            <div style={{ color: "#475569", fontSize: "9px", fontFamily: "'Cairo',sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <StatusBar current={current} queueLen={queue.length} />
      <div style={{ background: flash ? "rgba(16,185,129,0.12)" : "rgba(10,8,30,0.95)", border: `2px solid ${flash ? "#10b981" : "rgba(99,102,241,0.25)"}`, borderRadius: "20px", padding: "20px", marginBottom: "14px", textAlign: "center", transition: "all 0.4s" }}>
        <div style={{ color: "#475569", fontFamily: "'Cairo',sans-serif", fontSize: "11px", marginBottom: "4px" }}>يُخدم الآن</div>
        <div style={{ fontSize: "68px", fontWeight: "900", fontFamily: "'Bebas Neue',cursive", lineHeight: 1, background: current ? "linear-gradient(135deg,#10b981,#6ee7b7)" : "none", WebkitBackgroundClip: current ? "text" : "unset", WebkitTextFillColor: current ? "transparent" : "#1e293b", color: current ? undefined : "#1e293b" }}>
          {current ? String(current.ticket_number).padStart(3, "0") : "---"}
        </div>
        {current?.name && <div style={{ color: "#6ee7b7", fontFamily: "'Cairo',sans-serif", fontSize: "14px", marginTop: "4px" }}>👤 {current.name}</div>}
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={handleNext} disabled={queue.length === 0 || loading} style={{ flex: 3, padding: "18px", borderRadius: "14px", border: "none", background: queue.length === 0 ? "rgba(30,41,59,0.5)" : "linear-gradient(135deg,#10b981,#059669)", color: queue.length === 0 ? "#334155" : "#fff", fontSize: "16px", fontFamily: "'Cairo',sans-serif", fontWeight: "700", cursor: queue.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          ▶ {loading ? "..." : queue.length === 0 ? "الطابور فارغ" : `التالي (${queue.length})`}
        </button>
        <button onClick={handleSkip} disabled={queue.length === 0 || loading} style={{ flex: 1, padding: "18px", borderRadius: "14px", border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: queue.length === 0 ? "#334155" : "#f59e0b", fontSize: "20px", cursor: queue.length === 0 ? "not-allowed" : "pointer" }}>⏭</button>
      </div>
      <div style={{ background: "rgba(5,5,20,0.8)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "16px", overflow: "hidden", marginBottom: "14px" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(99,102,241,0.1)", color: "#475569", fontFamily: "'Cairo',sans-serif", fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
          <span>الرقم</span><span>الاسم</span><span>الإشعار</span>
        </div>
        {queue.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#334155", fontFamily: "'Cairo',sans-serif" }}>🎉 الطابور فارغ</div>
        ) : queue.slice(0, 7).map((t, i) => (
          <div key={t.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(99,102,241,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: i === 0 ? "rgba(99,102,241,0.07)" : "transparent" }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "19px", color: i === 0 ? "#a5b4fc" : "#475569" }}>{String(t.ticket_number).padStart(3, "0")}</div>
            <div style={{ color: i === 0 ? "#e2e8f0" : "#475569", fontFamily: "'Cairo',sans-serif", fontSize: "13px" }}>
              {t.name || "زائر"}
              {i === 0 && <span style={{ color: "#6366f1", fontSize: "10px", marginRight: "6px", background: "rgba(99,102,241,0.15)", padding: "2px 6px", borderRadius: "4px" }}>التالي</span>}
            </div>
            <div style={{ fontSize: "14px" }}>{t.notif_method === "whatsapp" ? "💬" : t.notif_method === "sms" ? "📱" : "—"}</div>
          </div>
        ))}
      </div>
      {!confirmClose ? (
        <button onClick={() => setConfirmClose(true)} style={{ width: "100%", padding: "11px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "13px", marginBottom: "8px" }}>🔒 إغلاق الطابور لهذا اليوم</button>
      ) : (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "14px", marginBottom: "8px", textAlign: "center" }}>
          <div style={{ color: "#f87171", fontFamily: "'Cairo',sans-serif", fontSize: "13px", marginBottom: "10px" }}>⚠️ هل أنت متأكد؟</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setConfirmClose(false)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)", background: "transparent", color: "#64748b", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>إلغاء</button>
            <button onClick={async () => { await supabase.from("sessions").update({ is_active: false }).eq("id", session.id); setConfirmClose(false); }} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: "700" }}>تأكيد</button>
          </div>
        </div>
      )}
      <button onClick={onLogout} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid rgba(99,102,241,0.15)", background: "transparent", color: "#334155", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "12px" }}>🚪 تسجيل الخروج</button>
    </div>
  );
}

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
      const channel = supabase.channel("queue-rt")
        .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `session_id=eq.${sess.id}` }, () => loadData(sess))
        .subscribe();
      return () => supabase.removeChannel(channel);
    })();
  }, []);

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#020617,#0f0f1a)", color: "#a5b4fc", fontFamily: "'Cairo',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎫</div>
        <div style={{ fontSize: "16px" }}>جاري تحميل النظام...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#020617 0%,#080818 60%,#020617 100%)", color: "#e2e8f0", fontFamily: "'Cairo',sans-serif", direction: "rtl" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <ParticlesBg />
      <nav style={{ position: "relative", zIndex: 10, borderBottom: "1px solid rgba(99,102,241,0.12)", background: "rgba(2,6,23,0.9)", backdropFilter: "blur(24px)", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", height: "54px" }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "19px", letterSpacing: "2px", background: "linear-gradient(135deg,#a5b4fc,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>QUEUE PRO 🎫</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[{ v: "client", icon: "👤", label: "العميل" }, { v: "staff", icon: "🖥️", label: "الموظف" }].map(tab => (
            <button key={tab.v} onClick={() => setView(tab.v)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid", borderColor: view === tab.v ? "#6366f1" : "rgba(99,102,241,0.15)", background: view === tab.v ? "rgba(99,102,241,0.18)" : "transparent", color: view === tab.v ? "#a5b4fc" : "#475569", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: "12px", fontWeight: view === tab.v ? "700" : "400" }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </nav>
      <div style={{ position: "relative", zIndex: 5, paddingTop: "10px", paddingBottom: "56px" }}>
        {view === "client" ? <ClientView session={session} queue={queue} current={current} /> : staffAuthed ? <StaffView session={session} queue={queue} current={current} reload={() => loadData()} onLogout={() => setStaffAuthed(false)} /> : <StaffLogin onLogin={() => setStaffAuthed(true)} />}
      </div>
      <div style={{ position: "fixed", bottom: "12px", left: "50%", transform: "translateX(-50%)", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "20px", padding: "4px 14px", color: "#6ee7b7", fontSize: "10px", fontFamily: "'Cairo',sans-serif", backdropFilter: "blur(12px)", zIndex: 20, whiteSpace: "nowrap" }}>
        ✅ متصل بـ Supabase • Real-time مفعّل
      </div>
    </div>
  );
}
