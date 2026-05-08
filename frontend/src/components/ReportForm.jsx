import { useState } from "react";
import api from "../services/api";

const INITIAL = { title: "", description: "", location: "", report_type: "traffic_jam", submitted_by: "" };

const TYPE_OPTIONS = [
  { value: "traffic_jam", label: "🚗 Kemacetan Lalu Lintas" },
  { value: "accident", label: "🚨 Kecelakaan" },
  { value: "other", label: "⚠️ Lainnya" },
];

export default function ReportForm({ onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await api.post("/api/reports", form);
      onCreated(res.data);
      setForm(INITIAL);
      setSuccess(`Laporan #${res.data.id} berhasil dikirim! Lanjutkan dengan mengunggah foto bukti.`);
    } catch (err) {
      setError("Gagal mengirim laporan. Periksa koneksi dan coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-eyebrow">📢 Fitur 2</div>
        <h2>Sistem Pelaporan <span>Kendala</span></h2>
        <p className="section-desc">
          Laporkan kemacetan, kecelakaan, atau kerusakan fasilitas transportasi kepada Dishub Kota Bandung.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
        <div className="form-card">
          {success && (
            <div className="alert alert-success" role="alert">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="alert alert-error" role="alert">
              ❌ {error}
            </div>
          )}

          <form id="report-form" onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="report-title">Judul Laporan *</label>
                <input
                  id="report-title"
                  className="form-input"
                  placeholder="Contoh: Kemacetan parah di Jl. Asia Afrika"
                  value={form.title}
                  onChange={set("title")}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="report-type">Jenis Kejadian *</label>
                <select
                  id="report-type"
                  className="form-select"
                  value={form.report_type}
                  onChange={set("report_type")}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="report-location">Lokasi Kejadian *</label>
                <input
                  id="report-location"
                  className="form-input"
                  placeholder="Nama jalan / persimpangan"
                  value={form.location}
                  onChange={set("location")}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="report-submitter">Nama Pelapor *</label>
                <input
                  id="report-submitter"
                  className="form-input"
                  placeholder="Nama Anda"
                  value={form.submitted_by}
                  onChange={set("submitted_by")}
                  required
                />
              </div>

              <div className="form-group full">
                <label className="form-label" htmlFor="report-desc">Deskripsi Lengkap *</label>
                <textarea
                  id="report-desc"
                  className="form-textarea"
                  placeholder="Deskripsikan situasi secara detail — kondisi jalan, estimasi panjang antrian, korban jika ada, dll."
                  value={form.description}
                  onChange={set("description")}
                  required
                />
              </div>

              <div className="form-group full">
                <button id="submit-report" className="btn btn-primary btn-full" type="submit" disabled={loading}>
                  {loading ? <><div className="spinner" /> Mengirim...</> : "📤 Kirim Laporan"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Info sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "🔒", title: "Data Aman", desc: "Laporan Anda disimpan di Amazon RDS yang terlindungi dalam Private Subnet." },
            { icon: "⚡", title: "Proses Cepat", desc: "Tim Dishub akan memverifikasi laporan dalam waktu singkat." },
            { icon: "📷", title: "Upload Bukti", desc: "Setelah laporan terkirim, Anda dapat melampirkan foto melalui tab Upload Bukti." },
          ].map((item) => (
            <div className="card" key={item.title} style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reports preview */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", color: "var(--text-secondary)", marginBottom: 12, fontWeight: 600 }}>
          Laporan terbaru akan tampil di tab Monitoring Admin setelah terverifikasi.
        </h3>
      </div>
    </section>
  );
}
