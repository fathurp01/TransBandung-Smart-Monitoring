import { useState } from "react";
import { uploadEvidence } from "../services/upload";

const fmt = b => b < 1048576 ? (b/1024).toFixed(1)+" KB" : (b/1048576).toFixed(1)+" MB";

export default function EvidenceUpload({ reports, onUploaded }) {
  const [rid,  setRid]  = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pct,  setPct]  = useState(0);
  const [ok,   setOk]   = useState(null);
  const [err,  setErr]  = useState(null);
  const [over, setOver] = useState(false);

  function pick(f) { if (f) { setFile(f); setOk(null); setErr(null); } }

  async function submit(e) {
    e.preventDefault();
    if (!rid || !file) return;
    setBusy(true); setPct(20); setOk(null); setErr(null);
    try {
      setPct(50);
      const url = await uploadEvidence(Number(rid), file);
      setPct(100);
      onUploaded(Number(rid), url);
      setOk("File berhasil diunggah ke Amazon S3 dan dapat diakses melalui Cloudflare CDN.");
      setFile(null); setRid("");
    } catch {
      setErr("Upload gagal. Periksa koneksi dan coba lagi.");
    } finally {
      setBusy(false);
      setTimeout(() => setPct(0), 1000);
    }
  }

  const sel = reports.find(r => r.id === Number(rid));

  return (
    <section>
      <div className="section-head">
        <div className="section-tag">Fitur S3 — Upload</div>
        <div className="section-title">Upload Foto Bukti</div>
        <p className="section-desc">
          Lampirkan foto kejadian untuk mendukung laporan. File diunggah ke Amazon S3 via Presigned URL dan diakses melalui Cloudflare CDN.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>
        <div className="form-block">
          {ok  && <div className="alert alert-ok">{ok}</div>}
          {err && <div className="alert alert-err">{err}</div>}

          <form id="evidence-form" onSubmit={submit}>
            <div className="form-col" style={{ marginBottom:14 }}>
              <label htmlFor="ev-report">Pilih laporan</label>
              <select id="ev-report" value={rid} onChange={e => setRid(e.target.value)} required>
                <option value="">— Pilih laporan —</option>
                {reports.map(r => (
                  <option key={r.id} value={r.id}>
                    #{r.id} — {r.title}
                  </option>
                ))}
              </select>
            </div>

            {sel && (
              <div style={{ padding:"8px 12px", background:"var(--bg-3)", borderRadius:"var(--r-sm)", marginBottom:14, fontSize:"0.78rem", color:"var(--text-2)" }}>
                Lokasi: <strong style={{ color:"var(--text-1)" }}>{sel.location}</strong>
                &ensp;|&ensp;Status: <strong style={{ color:"var(--yellow)" }}>{sel.status}</strong>
              </div>
            )}

            <div className="form-col" style={{ marginBottom:14 }}>
              <label>File gambar</label>
              <div
                id="drop-zone"
                className={`drop-zone ${over ? "over":""}`}
                onDragOver={e => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
              >
                <input id="ev-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => pick(e.target.files?.[0])} />
                <div className="drop-title"><span>Klik untuk memilih</span> atau seret gambar ke sini</div>
                <div className="drop-hint">JPG, PNG, WebP — maks. 10 MB</div>
              </div>
              {file && (
                <div className="file-row">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{fmt(file.size)}</span>
                  <button type="button" onClick={() => setFile(null)} style={{ background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", lineHeight:1, fontSize:"0.9rem" }}>✕</button>
                </div>
              )}
              {busy && <div className="prog-wrap"><div className="prog-bar" style={{ width:`${pct}%` }} /></div>}
            </div>

            <button id="btn-upload" className="btn btn-primary btn-full btn-lg" type="submit" disabled={busy || !file || !rid}>
              {busy ? <><div className="spin" /> Mengunggah ke S3...</> : "Upload ke Amazon S3"}
            </button>
          </form>
        </div>

        {/* Flow panel */}
        <div className="form-block" style={{ padding:"20px" }}>
          <div style={{ fontWeight:600, fontSize:"0.88rem", marginBottom:16 }}>Alur Upload</div>
          {[
            ["1","Presigned URL","Backend men-generate URL upload sementara dari S3 yang berlaku 15 menit."],
            ["2","Direct Upload","File diunggah langsung dari browser ke S3 tanpa melalui server backend."],
            ["3","Cloudflare CDN","Foto diakses melalui cdn.tbsm.my.id — lebih cepat dan aman."],
            ["4","Konfirmasi","URL CDN dicatat ke RDS dan tampil di dashboard Admin."],
          ].map(([n, t, d]) => (
            <div key={n} style={{ display:"flex", gap:12, marginBottom:14 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700, color:"#fff", flexShrink:0 }}>{n}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:"0.82rem", marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:"0.76rem", color:"var(--text-3)", lineHeight:1.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
