import { useState } from "react";
import api from "../services/api";

const TYPE_MAP = { traffic_jam: "Kemacetan", accident: "Kecelakaan", other: "Lainnya" };
const STATUS_CONFIG = {
  pending: { label: "Menunggu", cls: "badge-pending", icon: "⏳" },
  verified: { label: "Terverifikasi", cls: "badge-verified", icon: "✅" },
  resolved: { label: "Selesai", cls: "badge-resolved", icon: "🟢" },
  dismissed: { label: "Ditolak", cls: "badge-dismissed", icon: "❌" },
};

function formatDate(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ReportCard({ report, token, onStatusUpdated }) {
  const [loading, setLoading] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;

  async function changeStatus(status) {
    if (!token) { alert("Masukkan Admin Token terlebih dahulu."); return; }
    setLoading(status);
    try {
      const res = await api.patch(
        `/api/admin/reports/${report.id}/status`,
        { status, admin_notes: `Status diubah ke ${status} oleh admin.` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onStatusUpdated(res.data);
    } catch (e) {
      alert("Gagal mengubah status. Periksa token admin Anda.");
    } finally {
      setLoading(null);
    }
  }

  const evidenceCount = report.evidence_files?.filter((e) => e.cloudfront_url)?.length || 0;

  return (
    <div className="report-card" id={`admin-report-${report.id}`}>
      <div className="report-meta">
        <span className="report-id">#{report.id} · {formatDate(report.created_at)}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`badge ${report.report_type === "traffic_jam" ? "type-traffic_jam" : report.report_type === "accident" ? "type-accident" : "type-other"} report-type-badge`}>
            {TYPE_MAP[report.report_type] || report.report_type}
          </span>
          <span className={`badge ${statusCfg.cls}`}>
            <span className="badge-dot" />
            {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="report-title">{report.title}</div>
      <div className="report-desc" style={{ WebkitLineClamp: expanded ? "unset" : 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: expanded ? "visible" : "hidden" }}>
        {report.description}
      </div>
      {report.description?.length > 100 && (
        <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: "var(--accent-blue)", fontSize: "0.78rem", cursor: "pointer", padding: "2px 0", fontFamily: "inherit" }}>
          {expanded ? "Tampilkan lebih sedikit" : "Selengkapnya"}
        </button>
      )}

      <div className="report-footer" style={{ marginTop: 10 }}>
        <span className="report-footer-item">📍 {report.location}</span>
        <span className="report-footer-item">👤 {report.submitted_by}</span>
        {evidenceCount > 0 && <span className="report-footer-item">🖼️ {evidenceCount} foto</span>}
      </div>

      {/* Evidence thumbnails */}
      {evidenceCount > 0 && (
        <div className="evidence-grid">
          {report.evidence_files
            .filter((e) => e.cloudfront_url)
            .map((e) => (
              <a key={e.id} href={e.cloudfront_url} target="_blank" rel="noreferrer">
                <img
                  src={e.cloudfront_url}
                  alt="Bukti laporan"
                  className="evidence-thumb"
                  loading="lazy"
                />
              </a>
            ))}
        </div>
      )}

      {report.admin_notes && (
        <div className="admin-notes">💬 {report.admin_notes}</div>
      )}

      <div className="admin-actions">
        {report.status !== "verified" && (
          <button id={`verify-${report.id}`} className="btn btn-sm btn-success" onClick={() => changeStatus("verified")} disabled={!!loading}>
            {loading === "verified" ? <div className="spinner" /> : "✅"} Verifikasi
          </button>
        )}
        {report.status !== "resolved" && (
          <button id={`resolve-${report.id}`} className="btn btn-sm btn-outline" onClick={() => changeStatus("resolved")} disabled={!!loading}>
            {loading === "resolved" ? <div className="spinner" /> : "🟢"} Selesai
          </button>
        )}
        {report.status !== "dismissed" && (
          <button id={`dismiss-${report.id}`} className="btn btn-sm btn-danger" onClick={() => changeStatus("dismissed")} disabled={!!loading}>
            {loading === "dismissed" ? <div className="spinner" /> : "❌"} Tolak
          </button>
        )}
      </div>
    </div>
  );
}

const FILTERS = ["all", "pending", "verified", "resolved", "dismissed"];
const FILTER_LABELS = { all: "Semua", pending: "Menunggu", verified: "Terverifikasi", resolved: "Selesai", dismissed: "Ditolak" };

export default function AdminDashboard({ reports, onStatusUpdated }) {
  const [token, setToken] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = reports
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) =>
      !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase()) ||
      r.submitted_by?.toLowerCase().includes(search.toLowerCase())
    );

  const countByStatus = (s) => reports.filter((r) => r.status === s).length;

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-eyebrow">🛡️ Fitur 3</div>
        <h2>Dashboard <span>Validasi Admin</span></h2>
        <p className="section-desc">
          Kelola, verifikasi, dan tinjau semua laporan masyarakat. Foto bukti dimuat melalui Cloudflare CDN.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "Total Laporan", value: reports.length, icon: "📊", color: "var(--accent-blue)" },
          { label: "Menunggu", value: countByStatus("pending"), icon: "⏳", color: "var(--accent-yellow)" },
          { label: "Terverifikasi", value: countByStatus("verified"), icon: "✅", color: "var(--accent-cyan)" },
          { label: "Selesai", value: countByStatus("resolved"), icon: "🟢", color: "var(--accent-green)" },
        ].map((s) => (
          <div className="card" key={s.label} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Token input */}
      <div className="token-bar">
        <span className="token-icon">🔑</span>
        <span className="token-label">Admin Token</span>
        <input
          id="admin-token"
          type="password"
          className="form-input"
          placeholder="Masukkan Bearer token untuk mengubah status laporan..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          id="admin-search"
          className="form-input"
          placeholder="🔍 Cari laporan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
              {f !== "all" && countByStatus(f) > 0 && (
                <span style={{
                  background: "rgba(255,255,255,0.2)", borderRadius: "100px",
                  padding: "1px 6px", fontSize: "0.7rem", marginLeft: 4,
                }}>
                  {countByStatus(f)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Report list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{filter === "all" ? "📋" : STATUS_CONFIG[filter]?.icon}</div>
          <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            {search ? "Tidak ada laporan yang cocok" : `Belum ada laporan${filter !== "all" ? ` berstatus "${FILTER_LABELS[filter]}"` : ""}`}
          </p>
          <p>Laporan dari masyarakat akan muncul di sini setelah terkirim.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              token={token}
              onStatusUpdated={onStatusUpdated}
            />
          ))}
        </div>
      )}
    </section>
  );
}
