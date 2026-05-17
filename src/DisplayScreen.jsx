import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zondhwwrleijbpaziujl.supabase.co";
const SUPABASE_KEY = "sb_publishable_FPy29ZX2iXjEmODgOOarRA_zjws9XYp";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getOrCreateSession() {
  const today = new Date().toISOString().split("T")[0];
  let { data } = await supabase.from("sessions").select("*").eq("date", today).single();
  if (!data) {
    const { data: s } = await supabase.from("sessions").insert({ date: today, is_active: true }).select().single();
    return s;
  }
  return data;
}

async function fetchCurrent(sid) {
  const { data } = await supabase.from("tickets").select("*").eq("session_id", sid).eq("status", "serving").order("ticket_number", { ascending: false }).limit(1).single();
  return data || null;
}

async function fetchQueue(sid) {
  const { data } = await supabase.from("tickets").select("*").eq("session_id", sid).in("status", ["waiting", "notified"]).order("ticket_number", { ascending: true });
  return data || [];
}

async function fetchStats(sid) {
  const { data } = await supabase.from("tickets").select("status").eq("session_id", sid);
  if (!data) return { total: 0, done: 0, waiting: 0 };
  return {
    total: data.length,
    done: data.filter(t => t.status === "done" || t.status === "skipped").length,
    waiting: data.filter(t => t.status === "waiting" || t.status === "notified").length,
  };
}

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function DisplayScreen() {
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total: 0, done: 0, waiting: 0 });
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [prevNumber, setPrevNumber] = useState(null);
  const time = useTime();

  const loadData = async (sess) => {
    const s = sess || session;
    if (!s) return;
    const [c, q, st] = await Promise.all([fetchCurrent(s.id), fetchQueue(s.id), fetchStats(s.id)]);
    if (c && c.ticket_number !== prevNumber) {
      setFlash(true);
      setPrevNumber(c.ticket_number);
      setTimeout(() => setFlash(false), 2000);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      } catch(e) {}
    }
    setCurrent(c);
    setQueue(q);
    setStats(st);
  };

  useEffect(() => {
    (async () => {
      const sess = await getOrCreateSession();
      setSession(sess);
      await loadData(sess);
      setReady(true);
      const channel = supabase.channel("display-rt")
        .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `session_id=eq.${sess.id}` }, () => loadData(sess))
        .subscribe();
      return () => supabase.removeChannel(channel);
    })();
  }, []);

  const timeStr = time.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("ar-MA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6366f1", fontFamily: "'Cairo',sans-serif", fontSize: "24px" }}>جاري التحميل...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a0f 0%,#0f0a1f 50%,#0a0f1f 100%)", fontFamily: "'Cairo',sans-serif", direction: "rtl", overflow: "hidden", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg,rgba(99,102,241,0.05) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "fixed", top: "20%", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "20%", right: "10%", width: "300px", height: "300px", background: "radial-gradient(circle,rgba(236,72,153,0.1) 0%,transparent 70%)", borderRadius: "50%", zIndex: 0 }} />
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        @keyframes numberChange{0%{transform:scale(0.8);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
      `}</style>
      <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", minHeight: "100vh", padding: "24px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", animation: "fadeInUp 0.6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🎫</div>
            <div>
              <div style={{ color: "#fff", fontSize: "22px", fontWeight: "800" }}>QUEUE PRO</div>
              <div style={{ color: "#475569", fontSize: "12px", letterSpacing: "2px" }}>نظام إدارة الطابور</div>
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#fff", fontSize: "36px", fontFamily: "'Bebas Neue',cursive", letterSpacing: "3px", lineHeight: 1 }}>{timeStr}</div>
            <div style={{ color: "#475569", fontSize: "12px", textAlign: "center" }}>{dateStr}</div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", gap: "24px" }}>
          <div style={{ flex: 2, background: flash ? "rgba(99,102,241,0.15)" : "rgba(15,12,35,0.9)", border: `2px solid ${flash ? "rgba(99,102,241,0.8)" : "rgba(99,102,241,0.2)"}`, borderRadius: "28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", transition: "all 0.5s", position: "relative", overflow: "hidden", boxShadow: flash ? "0 0 60px rgba(99,102,241,0.3)" : "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg,#6366f1,#ec4899,#6366f1)", animation: "pulse 3s linear infinite" }} />
            <div style={{ color: "#475569", fontSize: "14px", letterSpacing: "6px", marginBottom: "12px" }}>يُخدم الآن</div>
            <div style={{ fontSize: "clamp(120px,20vw,220px)", fontFamily: "'Bebas Neue',cursive", lineHeight: 0.9, background: current ? "linear-gradient(135deg,#a5b4fc,#818cf8,#6366f1)" : "linear-gradient(135deg,#1e293b,#334155)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: current ? "drop-shadow(0 0 40px rgba(99,102,241,0.6))" : "none", animation: flash ? "numberChange 0.5s ease" : "none", letterSpacing: "8px" }}>
              {current ? String(current.ticket_number).padStart(3, "0") : "---"}
            </div>
            {current?.name && <div style={{ color: "#a5b4fc", fontSize: "28px", fontWeight: "700", marginTop: "16px" }}>👤 {current.name}</div>}
            {!current && <div style={{ color: "#334155", fontSize: "18px", marginTop: "16px" }}>في انتظار بدء الخدمة...</div>}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "إجمالي اليوم", value: stats.total, color: "#6366f1", icon: "📊" },
                { label: "تمت خدمتهم", value: stats.done, color: "#10b981", icon: "✅" },
                { label: "في الانتظار", value: stats.waiting, color: "#ec4899", icon: "⏳" },
                { label: "وقت الخدمة", value: "~5د", color: "#f59e0b", icon: "⏱️" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(15,12,35,0.9)", border: `1px solid ${s.color}25`, borderRadius: "16px", padding: "16px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</div>
                  <div style={{ color: s.color, fontSize: "32px", fontFamily: "'Bebas Neue',cursive", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: "#475569", fontSize: "10px", marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, background: "rgba(15,12,35,0.9)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "20px", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(99,102,241,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#6366f1", fontSize: "11px", letterSpacing: "3px" }}>قائمة الانتظار</div>
                <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "20px", padding: "2px 10px", color: "#a5b4fc", fontSize: "11px" }}>{queue.length} شخص</div>
              </div>
              {queue.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#334155", fontSize: "14px" }}>🎉 لا يوجد أحد في الانتظار</div>
              ) : queue.slice(0, 8).map((t, i) => (
                <div key={t.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(99,102,241,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", background: i === 0 ? "rgba(99,102,241,0.08)" : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: i === 0 ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',cursive", fontSize: "16px", color: i === 0 ? "#a5b4fc" : "#475569" }}>
                      {String(t.ticket_number).padStart(3, "0")}
                    </div>
                    <div style={{ color: i === 0 ? "#e2e8f0" : "#475569", fontSize: "13px" }}>{t.name || "زائر"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {i === 0 && <span style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontSize: "9px", padding: "2px 6px", borderRadius: "4px" }}>التالي</span>}
                    <span style={{ fontSize: "12px" }}>{t.notif_method === "whatsapp" ? "💬" : t.notif_method === "sms" ? "📱" : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              <div style={{ color: "#6ee7b7", fontSize: "11px" }}>متصل بـ Supabase • Real-time مفعّل</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center", color: "#1e293b", fontSize: "11px", letterSpacing: "2px" }}>
          QUEUE PRO DISPLAY SYSTEM • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
