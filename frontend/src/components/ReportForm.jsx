import { useState } from "react";
import api from "../services/api";

const INIT = { title:"", description:"", location:"", report_type:"traffic_jam", submitted_by:"" };

export default function ReportForm({ onCreated }) {
  const [form, setForm]   = useState(INIT);
  const [busy, setBusy]   = useState(false);
  const [ok,   setOk]     = useState(null);
  const [err,  setErr]    = useState(null);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setOk(null); setErr(null);
    try {
      const res = await api.post("/api/reports", form);
      onCreated(res.data);
      setForm(INIT);
      setOk(`Laporan #${res.data.id} berhasil dikirim. Silakan unggah foto bukti pada tab berikutnya.`);
    } catch {
      setErr("Gagal mengirim laporan. Periksa koneksi ke server dan coba lagi.");
    } finally { setBusy(false); }
  }

  return (
    <section>
      <div className="section-head">
        <div className="section-tag">Fitur 2 — Pelaporan</div>
        <div className="section-title">Kirim Laporan Kendala</div>
        <p className="section-desc">
          Laporkan kemacetan, kecelakaan, atau kerusakan fasilitas transportasi kepada Dinas Perhubungan Kota Bandung.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"start" }}>
        <div className="form-block">
          {ok  && <div className="alert alert-ok">{ok}</div>}
          {err && <div className="alert alert-err">{err}</div>}

          <form id="report-form" onSubmit={submit}>
            <div className="form-row" style={{ marginBottom:14 }}>
              <div className="form-col">
                <label htmlFor="f-title">Judul laporan</label>
                <input id="f-title" placeholder="Contoh: Kemacetan di Jl. Asia Afrika" value={form.title} onChange={set("title")} required />
              </div>
              <div className="form-col">
                <label htmlFor="f-type">Jenis kejadian</label>
                <select id="f-type" value={form.report_type} onChange={set("report_type")}>
                  <option value="traffic_jam">Kemacetan</option>
                  <option value="accident">Kecelakaan</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div className="form-col">
                <label htmlFor="f-loc">Lokasi kejadian</label>
                <input id="f-loc" placeholder="Nama jalan atau persimpangan" value={form.location} onChange={set("location")} required />
              </div>
              <div className="form-col">
                <label htmlFor="f-by">Nama pelapor</label>
                <input id="f-by" placeholder="Nama lengkap Anda" value={form.submitted_by} onChange={set("submitted_by")} required />
              </div>
              <div className="form-col span2">
                <label htmlFor="f-desc">Deskripsi</label>
                <textarea id="f-desc" placeholder="Deskripsikan situasi secara detail — kondisi, perkiraan panjang antrian, dan informasi penting lainnya." value={form.description} onChange={set("description")} required />
              </div>
            </div>
            <button id="btn-submit-report" className="btn btn-primary btn-full btn-lg" type="submit" disabled={busy}>
              {busy ? <><div className="spin" /> Mengirim...</> : "Kirim Laporan"}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { title:"Data tersimpan aman",   body:"Laporan disimpan di Amazon RDS dalam Private Subnet, terisolasi dari akses publik." },
            { title:"Diproses oleh Dishub",  body:"Tim Dinas Perhubungan akan memverifikasi laporan dan mengambil tindakan yang diperlukan." },
            { title:"Lampirkan foto bukti",  body:"Setelah laporan terkirim, Anda akan diarahkan untuk mengunggah foto melalui Amazon S3." },
          ].map(item => (
            <div key={item.title} className="card card-p" style={{ borderRadius:"var(--r-lg)" }}>
              <div style={{ fontWeight:600, fontSize:"0.85rem", marginBottom:5 }}>{item.title}</div>
              <div style={{ fontSize:"0.78rem", color:"var(--text-3)", lineHeight:1.55 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
