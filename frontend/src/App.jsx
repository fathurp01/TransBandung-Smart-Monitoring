import { useEffect, useState } from "react";

import AdminDashboard from "./components/AdminDashboard";
import EvidenceUpload from "./components/EvidenceUpload";
import ReportForm from "./components/ReportForm";
import TransportMonitor from "./components/TransportMonitor";
import api from "./services/api";

const TABS = [
  { id: "monitor", label: "🗺️ Monitoring", desc: "Rute & Jadwal" },
  { id: "report", label: "📢 Laporan", desc: "Kirim Laporan" },
  { id: "upload", label: "📎 Upload Bukti", desc: "Foto Kejadian" },
  { id: "admin", label: "🛡️ Admin", desc: "Dashboard" },
];

export default function App() {
  const [routes, setRoutes] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("monitor");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [routesRes, reportsRes] = await Promise.all([
        api.get("/api/routes"),
        api.get("/api/reports"),
      ]);
      setRoutes(routesRes.data);
      setReports(reportsRes.data);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleCreated(report) {
    setReports((prev) => [report, ...prev]);
  }

  function handleUploaded(reportId, cloudfrontUrl) {
    setReports((prev) =>
      prev.map((r) =>
        r.id !== reportId ? r : {
          ...r,
          evidence_files: [...(r.evidence_files || []), {
            id: Date.now(),
            cloudfront_url: cloudfrontUrl,
            upload_status: "completed",
            mime_type: "image/jpeg",
          }],
        }
      )
    );
  }

  function handleStatusUpdated(updated) {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <a className="navbar-brand" onClick={() => setActiveTab("monitor")}>
          <div className="navbar-logo">🚌</div>
          <div>
            <div>TransBandung</div>
            <div className="navbar-badge">SMART MONITORING</div>
          </div>
        </a>
        <ul className="navbar-nav">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                id={`nav-${t.id}`}
                className={`nav-link ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-eyebrow">
          <span /> SISTEM TRANSPORTASI KOTA BANDUNG
        </div>
        <h1>
          <span>TransBandung</span>
          <br />Smart Monitoring
        </h1>
        <p className="hero-desc">
          Platform pemantauan transportasi publik berbasis cloud — pantau rute, cek jadwal,
          dan laporkan insiden lalu lintas secara real-time.
        </p>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-value" id="stat-routes">
              {loading ? "—" : routes.length}
            </div>
            <div className="stat-label">Rute Aktif</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" id="stat-reports">
              {loading ? "—" : reports.length}
            </div>
            <div className="stat-label">Total Laporan</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" id="stat-pending">
              {loading ? "—" : reports.filter((r) => r.status === "pending").length}
            </div>
            <div className="stat-label">Menunggu Verifikasi</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" id="stat-resolved">
              {loading ? "—" : reports.filter((r) => r.status === "resolved").length}
            </div>
            <div className="stat-label">Terselesaikan</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="container">
        <div style={{ height: 40 }} />

        {activeTab === "monitor" && (
          <TransportMonitor routes={routes} loading={loading} />
        )}
        {activeTab === "report" && (
          <ReportForm onCreated={(r) => { handleCreated(r); setActiveTab("upload"); }} />
        )}
        {activeTab === "upload" && (
          <EvidenceUpload reports={reports} onUploaded={handleUploaded} />
        )}
        {activeTab === "admin" && (
          <AdminDashboard reports={reports} onStatusUpdated={handleStatusUpdated} />
        )}

        <div style={{ height: 40 }} />
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-brand">TransBandung Smart Monitoring</div>
        <p>Platform Pemantauan Transportasi Publik Kota Bandung · Powered by AWS ECS + CloudFront</p>
        <p style={{ marginTop: 8 }}>© 2025 TBSM · Dinas Perhubungan Kota Bandung</p>
      </footer>
    </>
  );
}
