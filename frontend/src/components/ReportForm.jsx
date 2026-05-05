import { useState } from "react";

import api from "../services/api";

const initialState = {
  title: "",
  description: "",
  location: "",
  report_type: "traffic_jam",
  submitted_by: "",
};

export default function ReportForm({ onCreated }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/api/reports", form);
      onCreated(response.data);
      setForm(initialState);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Laporan Kemacetan / Kecelakaan</h2>
      <form className="grid" onSubmit={submit}>
        <label>
          Judul
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          Lokasi
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        </label>
        <label>
          Jenis Laporan
          <select value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
            <option value="traffic_jam">Kemacetan</option>
            <option value="accident">Kecelakaan</option>
            <option value="other">Lainnya</option>
          </select>
        </label>
        <label>
          Nama Pengirim
          <input value={form.submitted_by} onChange={(e) => setForm({ ...form, submitted_by: e.target.value })} required />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Deskripsi
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Kirim Laporan"}</button>
      </form>
    </section>
  );
}
