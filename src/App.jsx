import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
 
// ─── Realistic simulated vehicle telemetry ───────────────────────────────────
const VEHICLES = [
  { id: "VH-001", name: "Ford F-250 #12",  cal: "v3.1.4", driver: "Marcus T.",  status: "normal",   lat: 28.53, lng: -81.37, mpg: 18.2, idle: 4,  rpm: 1850 },
  { id: "VH-002", name: "RAM 1500 #07",    cal: "v3.1.4", driver: "Sandra K.",  status: "warning",  lat: 28.61, lng: -81.20, mpg: 12.1, idle: 22, rpm: 3100 },
  { id: "VH-003", name: "Chevy 3500 #03",  cal: "v3.0.9", driver: "James W.",   status: "normal",   lat: 28.48, lng: -81.55, mpg: 17.8, idle: 6,  rpm: 1920 },
  { id: "VH-004", name: "Ford Transit #21",cal: "v3.1.4", driver: "Priya M.",   status: "critical", lat: 28.69, lng: -81.41, mpg:  8.9, idle: 41, rpm: 4200 },
  { id: "VH-005", name: "GMC Sierra #09",  cal: "v3.1.3", driver: "Leo C.",     status: "normal",   lat: 28.55, lng: -81.28, mpg: 16.9, idle: 8,  rpm: 2050 },
  { id: "VH-006", name: "RAM 2500 #14",    cal: "v3.0.9", driver: "Amy D.",     status: "normal",   lat: 28.42, lng: -81.32, mpg: 17.1, idle: 5,  rpm: 1780 },
  { id: "VH-007", name: "Ford F-150 #18",  cal: "v3.1.4", driver: "Carlos B.",  status: "warning",  lat: 28.58, lng: -81.18, mpg: 13.4, idle: 19, rpm: 2900 },
  { id: "VH-008", name: "Chevy Colorado #02", cal: "v3.1.3", driver: "Nina S.", status: "normal",   lat: 28.51, lng: -81.47, mpg: 19.3, idle: 3,  rpm: 1650 },
];
 
const CAL_VERSIONS = ["v3.0.9", "v3.1.3", "v3.1.4"];
 
function randBetween(a, b) { return a + Math.random() * (b - a); }
 
function generateTelemetry(baseRpm, baseMpg) {
  return Array.from({ length: 20 }, (_, i) => ({
    t: `${i * 3}s`,
    rpm:  Math.round(baseRpm + randBetween(-150, 150)),
    mpg:  +(baseMpg  + randBetween(-1.2, 1.2)).toFixed(1),
    throttle: Math.round(randBetween(12, 85)),
    coolant:  Math.round(randBetween(185, 205)),
  }));
}
 
function generateCalComparison() {
  return CAL_VERSIONS.map(v => ({
    version: v,
    avgMpg:  v === "v3.1.4" ? 16.8 : v === "v3.1.3" ? 15.9 : 14.6,
    vehicles: VEHICLES.filter(x => x.cal === v).length,
    fuelSaved: v === "v3.1.4" ? 12.4 : v === "v3.1.3" ? 8.1 : 0,
  }));
}
 
// ─── Status badge ─────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    normal:   { bg: "#1a3a2a", color: "#4ade80", label: "Normal"   },
    warning:  { bg: "#3a2e10", color: "#facc15", label: "Warning"  },
    critical: { bg: "#3a1414", color: "#f87171", label: "Critical" },
  };
  const s = map[status] || map.normal;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      padding: "2px 8px", borderRadius: 4,
      border: `1px solid ${s.color}33`,
      textTransform: "uppercase",
    }}>{s.label}</span>
  );
};
 
// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent, icon }) => (
  <div style={{
    background: "#161b27", border: "1px solid #232c3d",
    borderRadius: 8, padding: "18px 20px",
    borderLeft: `3px solid ${accent}`,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ color: "#6b7a99", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <div style={{ color: "#e2e8f0", fontSize: 26, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: "#6b7a99", fontSize: 12, marginTop: 6 }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 22, opacity: 0.5 }}>{icon}</span>
    </div>
  </div>
);
 
// ─── Custom tooltip for recharts ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e2535", border: "1px solid #2d3a52", borderRadius: 6, padding: "10px 14px", fontSize: 13 }}>
      <div style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: "'IBM Plex Mono', monospace" }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};
 
// ─── Main app ─────────────────────────────────────────────────────────────────
export default function FleetPulse() {
  const [activeVehicle, setActiveVehicle] = useState(VEHICLES[0]);
  const [telemetry, setTelemetry]         = useState(() => generateTelemetry(VEHICLES[0].rpm, VEHICLES[0].mpg));
  const [calData]                          = useState(generateCalComparison);
  const [activeTab, setActiveTab]          = useState("overview");
  const [tick, setTick]                    = useState(0);
  const intervalRef = useRef(null);
 
  // Live telemetry update
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTelemetry(prev => {
        const next = [...prev.slice(1), {
          t: `${prev.length * 3}s`,
          rpm:      Math.round(activeVehicle.rpm + randBetween(-200, 200)),
          mpg:      +(activeVehicle.mpg + randBetween(-1.5, 1.5)).toFixed(1),
          throttle: Math.round(randBetween(10, 90)),
          coolant:  Math.round(randBetween(183, 208)),
        }];
        return next;
      });
      setTick(t => t + 1);
    }, 1800);
    return () => clearInterval(intervalRef.current);
  }, [activeVehicle]);
 
  const handleVehicleSelect = (v) => {
    setActiveVehicle(v);
    setTelemetry(generateTelemetry(v.rpm, v.mpg));
  };
 
  const anomalies = VEHICLES.filter(v => v.status !== "normal");
  const avgMpg    = (VEHICLES.reduce((a, v) => a + v.mpg, 0) / VEHICLES.length).toFixed(1);
  const totalIdle = VEHICLES.reduce((a, v) => a + v.idle, 0);
 
  const NAV_ITEMS = ["overview", "telemetry", "calibration", "anomalies"];
 
  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#0f1420", color: "#c9d1e0",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: "#111827",
        borderRight: "1px solid #1e2a3a",
        display: "flex", flexDirection: "column",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1e2a3a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: "linear-gradient(135deg, #e85d04, #f48c06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "#fff",
            }}>⚙</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>FleetPulse</div>
              <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.05em" }}>by Derive Systems</div>
            </div>
          </div>
        </div>
 
        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px 8px" }}>Dashboard</div>
          {NAV_ITEMS.map(tab => {
            const icons = { overview: "▦", telemetry: "📈", calibration: "🔧", anomalies: "⚠" };
            const labels = { overview: "Overview", telemetry: "Live Telemetry", calibration: "Calibrations", anomalies: "Anomalies" };
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 12px", marginBottom: 2, borderRadius: 6,
                background: active ? "#1e3a5f" : "transparent",
                color: active ? "#60a5fa" : "#7a8aaa",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
                textAlign: "left", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 14 }}>{icons[tab]}</span>
                {labels[tab]}
                {tab === "anomalies" && anomalies.length > 0 && (
                  <span style={{
                    marginLeft: "auto", background: "#7f1d1d", color: "#fca5a5",
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  }}>{anomalies.length}</span>
                )}
              </button>
            );
          })}
 
          <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 8px 8px" }}>Fleet ({VEHICLES.length})</div>
          {VEHICLES.map(v => (
            <button key={v.id} onClick={() => handleVehicleSelect(v)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 12px", marginBottom: 1, borderRadius: 6,
              background: activeVehicle.id === v.id ? "#1a2535" : "transparent",
              color: activeVehicle.id === v.id ? "#e2e8f0" : "#5a6a88",
              border: "none", cursor: "pointer", fontSize: 12, textAlign: "left",
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: v.status === "critical" ? "#f87171" : v.status === "warning" ? "#facc15" : "#4ade80",
              }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
            </button>
          ))}
        </nav>
 
        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #1e2a3a", fontSize: 11, color: "#3a4a60" }}>
          <div>ECU Cal Mgmt v3.1.4</div>
          <div style={{ color: "#4ade8066", marginTop: 2 }}>● Live · {new Date().toLocaleTimeString()}</div>
        </div>
      </aside>
 
      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
 
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>
              {activeTab === "overview"    ? "Fleet Overview"
              : activeTab === "telemetry"  ? `Live Telemetry — ${activeVehicle.name}`
              : activeTab === "calibration"? "Calibration Performance"
              :                              "Anomaly Detection"}
            </h1>
            <div style={{ color: "#4a5568", fontSize: 13, marginTop: 3 }}>
              Sanford Fleet · Updated {tick} ticks ago
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              background: "#1a2535", border: "1px solid #2d3a52",
              borderRadius: 6, padding: "7px 14px", fontSize: 13, color: "#60a5fa",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s infinite" }} />
              Live Feed
            </div>
          </div>
        </div>
 
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard label="Active Vehicles"   value={VEHICLES.length}      sub="All online"             accent="#60a5fa" icon="🚗" />
              <StatCard label="Anomalies"         value={anomalies.length}     sub={`${anomalies.filter(a=>a.status==="critical").length} critical`} accent="#f87171" icon="⚠" />
              <StatCard label="Fleet Avg MPG"     value={avgMpg}               sub="↑ 14% vs last month"    accent="#4ade80" icon="⛽" />
              <StatCard label="Total Idle (min)"  value={totalIdle}            sub="Target: <60 min"        accent="#facc15" icon="⏱" />
            </div>
 
            {/* Vehicle table */}
            <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2a3a", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0" }}>Vehicle Fleet</span>
                <span style={{ fontSize: 12, color: "#4a5568" }}>{VEHICLES.length} vehicles</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#111827" }}>
                    {["Vehicle ID", "Name", "Driver", "Cal Version", "MPG", "Idle (min)", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#4a5568", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #1e2a3a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VEHICLES.map((v, i) => (
                    <tr key={v.id}
                      onClick={() => { handleVehicleSelect(v); setActiveTab("telemetry"); }}
                      style={{
                        background: i % 2 === 0 ? "#161b27" : "#131720",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1a2535"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#161b27" : "#131720"}
                    >
                      <td style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", color: "#60a5fa", fontSize: 12 }}>{v.id}</td>
                      <td style={{ padding: "10px 16px", color: "#c9d1e0" }}>{v.name}</td>
                      <td style={{ padding: "10px 16px", color: "#7a8aaa" }}>{v.driver}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", color: "#a78bfa", fontSize: 12 }}>{v.cal}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", color: v.mpg < 13 ? "#f87171" : "#4ade80" }}>{v.mpg}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", color: v.idle > 20 ? "#facc15" : "#c9d1e0" }}>{v.idle}</td>
                      <td style={{ padding: "10px 16px" }}><Badge status={v.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            {/* Pie + MPG bar side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
              <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "18px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0", marginBottom: 16 }}>Status Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[
                      { name: "Normal",   value: VEHICLES.filter(v=>v.status==="normal").length   },
                      { name: "Warning",  value: VEHICLES.filter(v=>v.status==="warning").length  },
                      { name: "Critical", value: VEHICLES.filter(v=>v.status==="critical").length },
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      <Cell fill="#4ade80" />
                      <Cell fill="#facc15" />
                      <Cell fill="#f87171" />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: "#7a8aaa", fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
 
              <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "18px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0", marginBottom: 16 }}>MPG by Vehicle</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={VEHICLES.map(v => ({ name: v.id, mpg: v.mpg, fill: v.mpg < 13 ? "#f87171" : v.mpg < 15 ? "#facc15" : "#4ade80" }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis dataKey="name" tick={{ fill: "#4a5568", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#4a5568", fontSize: 11 }} domain={[0, 25]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="mpg" radius={[3,3,0,0]}>
                      {VEHICLES.map((v, i) => <Cell key={i} fill={v.mpg < 13 ? "#f87171" : v.mpg < 15 ? "#facc15" : "#4ade80"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
 
        {/* ── TELEMETRY TAB ── */}
        {activeTab === "telemetry" && (
          <div>
            {/* Vehicle info bar */}
            <div style={{
              background: "#161b27", border: "1px solid #232c3d", borderRadius: 8,
              padding: "14px 20px", marginBottom: 20,
              display: "flex", gap: 32, alignItems: "center",
            }}>
              <div>
                <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Vehicle</div>
                <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15 }}>{activeVehicle.name}</div>
              </div>
              <div>
                <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Driver</div>
                <div style={{ color: "#c9d1e0", fontSize: 14 }}>{activeVehicle.driver}</div>
              </div>
              <div>
                <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Calibration</div>
                <div style={{ color: "#a78bfa", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}>{activeVehicle.cal}</div>
              </div>
              <div>
                <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                <Badge status={activeVehicle.status} />
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ color: "#4ade8066", fontSize: 12 }}>● Streaming live</div>
              </div>
            </div>
 
            {/* Live stat mini-cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "RPM",         value: telemetry[telemetry.length-1]?.rpm,      unit: "rpm", color: "#60a5fa" },
                { label: "Fuel Economy",value: telemetry[telemetry.length-1]?.mpg,      unit: "mpg", color: "#4ade80" },
                { label: "Throttle",    value: telemetry[telemetry.length-1]?.throttle, unit: "%",   color: "#f97316" },
                { label: "Coolant",     value: telemetry[telemetry.length-1]?.coolant,  unit: "°F",  color: "#e879f9" },
              ].map(s => (
                <div key={s.label} style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ color: s.color, fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 700 }}>
                    {s.value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4, color: "#4a5568" }}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
 
            {/* RPM + MPG charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "18px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0", marginBottom: 14 }}>Engine RPM — Live</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={telemetry}>
                    <defs>
                      <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis dataKey="t" tick={{ fill: "#4a5568", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#4a5568", fontSize: 10 }} domain={[800, 5000]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="rpm" stroke="#60a5fa" strokeWidth={2} fill="url(#rpmGrad)" name="RPM" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
 
              <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "18px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0", marginBottom: 14 }}>Fuel Economy — Live (MPG)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={telemetry}>
                    <defs>
                      <linearGradient id="mpgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis dataKey="t" tick={{ fill: "#4a5568", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#4a5568", fontSize: 10 }} domain={[5, 25]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="mpg" stroke="#4ade80" strokeWidth={2} fill="url(#mpgGrad)" name="MPG" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
 
            {/* Throttle line chart */}
            <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "18px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0", marginBottom: 14 }}>Throttle Position & Coolant Temp</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="t" tick={{ fill: "#4a5568", fontSize: 10 }} />
                  <YAxis yAxisId="left"  tick={{ fill: "#4a5568", fontSize: 10 }} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#4a5568", fontSize: 10 }} domain={[160, 230]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: "#7a8aaa", fontSize: 12 }}>{v}</span>} />
                  <Line yAxisId="left"  type="monotone" dataKey="throttle" stroke="#f97316" strokeWidth={1.5} dot={false} name="Throttle %" />
                  <Line yAxisId="right" type="monotone" dataKey="coolant"  stroke="#e879f9" strokeWidth={1.5} dot={false} name="Coolant °F" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
 
        {/* ── CALIBRATION TAB ── */}
        {activeTab === "calibration" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {calData.map(c => (
                <div key={c.version} style={{
                  background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "20px 22px",
                  borderTop: `3px solid ${c.version === "v3.1.4" ? "#60a5fa" : c.version === "v3.1.3" ? "#a78bfa" : "#4a5568"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{c.version}</span>
                    {c.version === "v3.1.4" && <span style={{ background: "#1a3a2a", color: "#4ade80", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>LATEST</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Avg MPG",     value: c.avgMpg,                  color: "#4ade80" },
                      { label: "Vehicles",    value: c.vehicles,                color: "#60a5fa" },
                      { label: "Fuel Saved",  value: `${c.fuelSaved}%`,         color: "#f97316" },
                      { label: "Performance", value: c.version === "v3.1.4" ? "Optimal" : "Baseline", color: "#a78bfa" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "#111827", borderRadius: 6, padding: "10px 12px" }}>
                        <div style={{ color: "#4a5568", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                        <div style={{ color: m.color, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 16 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
 
            <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0", marginBottom: 16 }}>Average MPG by Calibration Version</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={calData} barSize={60}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="version" tick={{ fill: "#7a8aaa", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }} />
                  <YAxis tick={{ fill: "#4a5568", fontSize: 12 }} domain={[0, 22]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="avgMpg" name="Avg MPG" radius={[4,4,0,0]}>
                    {calData.map((c, i) => (
                      <Cell key={i} fill={c.version === "v3.1.4" ? "#60a5fa" : c.version === "v3.1.3" ? "#a78bfa" : "#4a5568"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
 
            <div style={{ background: "#161b27", border: "1px solid #232c3d", borderRadius: 8, padding: "18px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#c9d1e0", marginBottom: 12 }}>Vehicle–Calibration Mapping</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#111827" }}>
                    {["Vehicle", "Calibration", "MPG", "Idle (min)", "Recommendation"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#4a5568", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #1e2a3a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VEHICLES.map((v, i) => {
                    const needsUpgrade = v.cal !== "v3.1.4";
                    return (
                      <tr key={v.id} style={{ background: i%2===0 ? "#161b27" : "#131720" }}>
                        <td style={{ padding: "10px 16px", color: "#c9d1e0" }}>{v.name}</td>
                        <td style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", color: "#a78bfa", fontSize: 12 }}>{v.cal}</td>
                        <td style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", color: v.mpg < 13 ? "#f87171" : "#4ade80" }}>{v.mpg}</td>
                        <td style={{ padding: "10px 16px", color: v.idle > 20 ? "#facc15" : "#7a8aaa" }}>{v.idle} min</td>
                        <td style={{ padding: "10px 16px" }}>
                          {needsUpgrade
                            ? <span style={{ background: "#1e2a4a", color: "#60a5fa", fontSize: 11, padding: "3px 9px", borderRadius: 4, fontWeight: 600 }}>↑ Upgrade to v3.1.4</span>
                            : <span style={{ color: "#4ade80", fontSize: 12 }}>✓ Up to date</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
 
        {/* ── ANOMALIES TAB ── */}
        {activeTab === "anomalies" && (
          <div>
            <div style={{ background: "#1a1014", border: "1px solid #3a1a1a", borderRadius: 8, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>⚠</span>
              <span style={{ color: "#fca5a5", fontSize: 13 }}>
                <strong>{anomalies.filter(a=>a.status==="critical").length} critical</strong> and <strong>{anomalies.filter(a=>a.status==="warning").length} warning</strong> anomalies detected. Review vehicles below.
              </span>
            </div>
 
            <div style={{ display: "grid", gap: 14 }}>
              {anomalies.map(v => (
                <div key={v.id} style={{
                  background: "#161b27", border: `1px solid ${v.status === "critical" ? "#7f1d1d" : "#713f12"}`,
                  borderRadius: 8, padding: "18px 22px",
                  borderLeft: `4px solid ${v.status === "critical" ? "#f87171" : "#facc15"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>{v.name}</div>
                        <div style={{ color: "#4a5568", fontSize: 12, marginTop: 2 }}>Driver: {v.driver} · Cal: <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>{v.cal}</span></div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Badge status={v.status} />
                      <button onClick={() => { handleVehicleSelect(v); setActiveTab("telemetry"); }} style={{
                        background: "#1e2535", border: "1px solid #2d3a52", color: "#60a5fa",
                        padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
                      }}>View Live →</button>
                    </div>
                  </div>
 
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { label: "MPG",       value: v.mpg,       unit: "",    warn: v.mpg < 13,  msg: "Below threshold (13.0)" },
                      { label: "Idle Time", value: v.idle,      unit: " min",warn: v.idle > 20, msg: "Exceeds limit (20 min)"  },
                      { label: "Avg RPM",   value: v.rpm,       unit: "",    warn: v.rpm > 3000,msg: "High sustained RPM"      },
                      { label: "Cal Ver",   value: v.cal,       unit: "",    warn: v.cal !== "v3.1.4", msg: "Outdated calibration" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "#111827", borderRadius: 6, padding: "10px 14px" }}>
                        <div style={{ color: "#4a5568", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                        <div style={{ color: m.warn ? "#f87171" : "#7a8aaa", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15 }}>{m.value}{m.unit}</div>
                        {m.warn && <div style={{ color: "#f8717166", fontSize: 10, marginTop: 3 }}>{m.msg}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
 
            {anomalies.length === 0 && (
              <div style={{ textAlign: "center", color: "#4ade80", padding: "60px 0", fontSize: 16 }}>
                ✓ No anomalies detected. All vehicles operating normally.
              </div>
            )}
          </div>
        )}
      </main>
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: #0f1420; }
        ::-webkit-scrollbar-thumb { background: #232c3d; border-radius: 3px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
 
