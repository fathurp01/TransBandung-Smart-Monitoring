import { useState } from "react";
import { uploadEvidence } from "../services/upload";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function EvidenceUpload({ reports, onUploaded }) {
  const [reportId, setReportId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setSuccess(null);
    setError(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!reportId || !file) return;
    setLoading(true);
    setProgress(10);
    setSuccess(null);
    setError(null);
    try {
      setProgress(30);
      const url = await uploadEvidence(Number(reportId), file);
      setProgress(100);
      onUploaded(Number(reportId), url);
      setSuccess("✅ Foto bukti berhasil diunggah ke Amazon S3 dan dapat diakses melalui Cloudflare CDN.");
      setFile(null);
      setReportId("");
    } catch (err) {
      setError("❌ Upload gagal. Periksa koneksi dan coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  }

  const selectedReport = reports.find((r) => r.id === Number(reportId));

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-eyebrow">📎 Fitur S3</div>
        <h2>Upload Bukti <span>Foto</span></h2>
        <p className="section-desc">
          Lampirkan foto kejadian untuk memperkuat laporan. File diunggah langsung ke Amazon S3
          melalui Presigned URL, lalu didistribusikan via Cloudflare CDN.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div className="form-card">
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form id="evidence-form" onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="evidence-report">Pilih Laporan *</label>
              <select
                id="evidence-report"
                className="form-select"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                required
              >
                <option value="">— Pilih laporan yang telah dikirim —</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.id} · {r.title} ({r.report_type === "traffic_jam" ? "Kemacetan" : r.report_type === "accident" ? "Kecelakaan" : "Lainnya"})
                  </option>
                ))}
              </select>
            </div>

            {selectedReport && (
              <div style={{
                background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.82rem",
              }}>
                <span style={{ color: "var(--text-muted)" }}>Lokasi: </span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{selectedReport.location}</span>
                <span style={{ marginLeft: 12, color: "var(--text-muted)" }}>Status: </span>
                <span style={{ color: "var(--accent-yellow)", fontWeight: 600, textTransform: "capitalize" }}>{selectedReport.status}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">File Gambar *</label>
              <div
                id="file-drop-zone"
                className={`file-drop ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              >
                <input
                  id="evidence-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                <div className="file-drop-icon">🖼️</div>
                <div className="file-drop-text">
                  <span>Klik untuk memilih</span> atau seret gambar ke sini
                </div>
                <div className="file-drop-hint">JPG, PNG, WebP — maks. 10 MB</div>
              </div>

              {file && (
                <div className="file-preview">
                  <span>📄</span>
                  <span className="file-preview-name">{file.name}</span>
                  <span className="file-preview-size">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontSize: "1rem" }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {loading && (
                <div className="upload-progress">
                  <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>

            <button id="submit-upload" className="btn btn-primary btn-full" type="submit" disabled={loading || !file || !reportId}>
              {loading ? <><div className="spinner" /> Mengunggah ke S3...</> : "☁️ Upload ke Amazon S3"}
            </button>
          </form>
        </div>

        {/* Flow explanation */}
        <div>
          <div className="form-card" style={{ padding: "24px" }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: 20, fontSize: "1rem" }}>
              Alur Upload Bukti
            </h3>
            {[
              { step: "1", icon: "🔐", title: "Presigned URL", desc: "Backend men-generate URL upload sementara dari Amazon S3 yang berlaku 15 menit." },
              { step: "2", icon: "☁️", title: "Direct Upload ke S3", desc: "File diunggah langsung dari browser ke bucket S3 tanpa melalui server backend." },
              { step: "3", icon: "🌐", title: "Cloudflare CDN", desc: "Setelah tersimpan, foto diakses melalui cdn.tbsm.my.id — lebih cepat dan aman." },
              { step: "4", icon: "✅", title: "Konfirmasi", desc: "Backend mencatat URL CDN ke database RDS untuk tampil di dashboard Admin." },
            ].map((item) => (
              <div key={item.step} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "var(--gradient-accent)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "0.8rem",
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 3 }}>
                    {item.icon} {item.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {reports.length > 0 && (
            <div className="form-card" style={{ padding: "18px 20px", marginTop: 16 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 10 }}>
                LAPORAN TERSEDIA
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {reports.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setReportId(String(r.id))}
                    style={{
                      padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                      background: reportId === String(r.id) ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${reportId === String(r.id) ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
                      fontSize: "0.82rem", transition: "all 0.15s",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>#{r.id}</span>{" "}
                    <span style={{ fontWeight: 600 }}>{r.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
