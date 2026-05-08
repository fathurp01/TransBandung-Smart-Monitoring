import { useState } from "react";
import api from "../services/api";

const TYPE = { traffic_jam:"Kemacetan", accident:"Kecelakaan", other:"Lainnya" };
const ST = {
  pending:   { label:"Menunggu",      cls:"badge-pending" },
  verified:  { label:"Terverifikasi", cls:"badge-verified" },
  resolved:  { label:"Selesai",       cls:"badge-resolved" },
  dismissed: { label:"Ditolak",       cls:"badge-dismissed" },
};
const TYPE_CLS = { traffic_jam:"badge-jam", accident:"badge-accident", other:"badge-other" };

function fmtDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

function ReportCard({ report, token, onStatusUpdated }) {
  const [busy, setBusy] = useState(null);
  const cfg = ST[report.status] || ST.pending;
  const photos = report.evidence_files?.filter(e => e.cloudfront_url) || [];

  async function change(status) {
    if (!token) { alert("Masukkan Admin Token."); return; }
    setBusy(status);
    try {
      const res = await api.patch(
        `/api/admin/reports/${report.id}/status`,
        { status, admin_notes:`Status diubah ke ${status}.` },
        { headers:{ Authorization:`Bearer ${token}` } }
      );
      onStatusUpdated(res.data);
    } catch {
      alert("Gagal mengubah status. Periksa token admin.");
    } finally { setBusy(null); }
  }

  return (
    <div className="rcard" id={`rcard-${report.id}`}>
      <div className="rcard-top">
        <span className="rcard-id">#{report.id} · {fmtDate(report.created_at)}</span>
        <div style={{ display:"flex", gap:6 }}>
          <span className={`badge ${TYPE_CLS[report.report_type] || "badge-other"}`}>
            {TYPE[report.report_type] || report.report_type}
          </span>
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
        </div>
      </div>

      <div className="rcard-title">{report.title}</div>
      <div className="rcard-desc">{report.description}</div>

      <div className="rcard-meta">
        <span>{report.location}</span>
        <span>{report.submitted_by}</span>
        {photos.length > 0 && <span>{photos.length} foto</span>}
      </div>

      {photos.length > 0 && (
        <div className="ev-grid">
          {photos.map(ev => (
            <a key={ev.id} href={ev.cloudfront_url} target="_blank" rel="noreferrer">
              <img src={ev.cloudfront_url} alt="Bukti laporan" className="ev-thumb" loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {report.admin_notes && <div className="rcard-note">{report.admin_notes}</div>}

      <div className="rcard-actions">
        {report.status !== "verified" && (
          <button id={`btn-verify-${report.id}`} className="btn btn-sm btn-green" onClick={() => change("verified")} disabled={!!busy}>
            {busy==="verified" ? <div className="spin"/> : null} Verifikasi
          </button>
        )}
        {report.status !== "resolved" && (
          <button id={`btn-resolve-${report.id}`} className="btn btn-sm btn-ghost" onClick={() => change("resolved")} disabled={!!busy}>
            {busy==="resolved" ? <div className="spin"/> : null} Selesai
          </button>
        )}
        {report.status !== "dismissed" && (
          <button id={`btn-dismiss-${report.id}`} className="btn btn-sm btn-red" onClick={() => change("dismissed")} disabled={!!busy}>
            {busy==="dismissed" ? <div className="spin"/> : null} Tolak
          </button>
        )}
      </div>
    </div>
  );
}

const FILTERS = ["all","pending","verified","resolved","dismissed"];
const F_LABELS = { all:"Semua", pending:"Menunggu", verified:"Terverifikasi", resolved:"Selesai", dismissed:"Ditolak" };

export default function AdminDashboard({ reports, onStatusUpdated }) {
  const [token,  setToken]  = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const count = s => reports.filter(r => r.status === s).length;

  const list = reports
    .filter(r => filter === "all" || r.status === filter)
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.title?.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q) || r.submitted_by?.toLowerCase().includes(q);
    });

  return (
    <section>
      <div className="section-head">
        <div className="section-tag">Fitur 3 — Admin</div>
        <div className="section-title">Dashboard Validasi</div>
        <p className="section-desc">
          Tinjau, verifikasi, dan kelola semua laporan masyarakat. Foto bukti dimuat melalui Cloudflare CDN.
        </p>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom:24 }}>
        {[
          { label:"Total Laporan",  value: reports.length, color:"var(--text-1)" },
          { label:"Menunggu",       value: count("pending"),   color:"var(--yellow)" },
          { label:"Terverifikasi",  value: count("verified"),  color:"var(--blue)" },
          { label:"Selesai",        value: count("resolved"),  color:"var(--green)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-n" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-card-l">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Token */}
      <div className="token-row">
        <span className="token-label">Admin Token</span>
        <input
          id="admin-token"
          type="password"
          placeholder="Masukkan token untuk mengubah status laporan"
          value={token}
          onChange={e => setToken(e.target.value)}
          style={{ flex:1, minWidth:0 }}
        />
      </div>

      {/* Filter + search */}
      <div className="filter-row">
        <input
          id="admin-search"
          className="search-input"
          placeholder="Cari laporan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {FILTERS.map(f => (
          <button
            key={f}
            id={`filter-${f}`}
            className={`btn btn-sm ${filter===f ? "btn-primary":"btn-ghost"}`}
            onClick={() => setFilter(f)}
          >
            {F_LABELS[f]}
            {f !== "all" && count(f) > 0 && (
              <span style={{ marginLeft:5, opacity:0.7, fontWeight:500 }}>{count(f)}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="empty">
          <div className="empty-title">
            {search ? "Tidak ada laporan yang cocok" : `Tidak ada laporan${filter!=="all" ? ` berstatus "${F_LABELS[filter]}"` : ""}`}
          </div>
          <div className="empty-sub">Laporan masyarakat akan muncul di sini setelah terkirim.</div>
        </div>
      ) : (
        <div className="grid-2">
          {list.map(r => (
            <ReportCard key={r.id} report={r} token={token} onStatusUpdated={onStatusUpdated} />
          ))}
        </div>
      )}
    </section>
  );
}
