import { useEffect, useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import EvidenceUpload from "./components/EvidenceUpload";
import ReportForm from "./components/ReportForm";
import TransportMonitor from "./components/TransportMonitor";
import api from "./services/api";

const TABS = [
  { id: "monitor", label: "Monitoring" },
  { id: "report",  label: "Kirim Laporan" },
  { id: "upload",  label: "Upload Bukti" },
  { id: "admin",   label: "Admin" },
];

export default function App() {
  const [routes,  setRoutes]  = useState([]);
  const [reports, setReports] = useState([]);
  const [tab,     setTab]     = useState("monitor");
  const [ready,   setReady]   = useState(false);

  async function load() {
    try {
      const [r1, r2] = await Promise.all([api.get("/api/routes"), api.get("/api/reports")]);
      setRoutes(r1.data);
      setReports(r2.data);
    } catch (e) {
      console.warn("Data load failed:", e?.message);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { load(); }, []);

  function onCreated(report) {
    setReports((p) => [report, ...p]);
    setTab("upload");
  }
  function onUploaded(reportId, url) {
    setReports((p) => p.map((r) =>
      r.id !== reportId ? r : {
        ...r,
        evidence_files: [...(r.evidence_files || []), { id: Date.now(), cloudfront_url: url, upload_status: "completed" }],
      }
    ));
  }
  function onStatusUpdated(updated) {
    setReports((p) => p.map((r) => (r.id === updated.id ? updated : r)));
  }

  const pending  = reports.filter((r) => r.status === "pending").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => setTab("monitor")}>
          <div className="nav-brand-mark">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div>
            <div className="nav-brand-name">TransBandung</div>
            <div className="nav-brand-sub">Smart Monitoring</div>
          </div>
        </div>

        <div className="nav-links">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`nav-${t.id}`}
              className={`nav-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {tab === t.id && <span className="nav-dot" />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="nav-pill">
          <span className="nav-pill-dot" />
          Sistem Aktif
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-label">Platform Transportasi Publik · Kota Bandung</div>
          <h1>TransBandung<br />Smart Monitoring</h1>
          <p>
            Pantau jadwal transportasi publik, laporkan insiden lalu lintas, dan ikuti
            tindak lanjut secara transparan — semuanya dalam satu platform berbasis cloud.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-n" id="s-routes">{ready ? routes.length : "—"}</div>
              <div className="stat-l">Rute Aktif</div>
            </div>
            <div className="stat">
              <div className="stat-n" id="s-reports">{ready ? reports.length : "—"}</div>
              <div className="stat-l">Total Laporan</div>
            </div>
            <div className="stat">
              <div className="stat-n" id="s-pending">{ready ? pending : "—"}</div>
              <div className="stat-l">Menunggu Verifikasi</div>
            </div>
            <div className="stat">
              <div className="stat-n" id="s-resolved">{ready ? resolved : "—"}</div>
              <div className="stat-l">Diselesaikan</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="page">
        {tab === "monitor" && <TransportMonitor routes={routes} ready={ready} />}
        {tab === "report"  && <ReportForm onCreated={onCreated} />}
        {tab === "upload"  && <EvidenceUpload reports={reports} onUploaded={onUploaded} />}
        {tab === "admin"   && <AdminDashboard reports={reports} onStatusUpdated={onStatusUpdated} />}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <strong>TransBandung Smart Monitoring</strong> &nbsp;·&nbsp;
        Dinas Perhubungan Kota Bandung &nbsp;·&nbsp;
        Ditenagai oleh AWS ECS, RDS, S3, dan Cloudflare CDN
      </footer>
    </>
  );
}
