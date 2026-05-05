import { useState } from "react";

import { uploadEvidence } from "../services/upload";

export default function EvidenceUpload({ reports, onUploaded }) {
  const [reportId, setReportId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!reportId || !file) return;
    setLoading(true);
    try {
      const cloudfrontUrl = await uploadEvidence(Number(reportId), file);
      onUploaded(Number(reportId), cloudfrontUrl);
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Upload Bukti Laporan</h2>
      <form className="grid" onSubmit={submit}>
        <label>
          Pilih Laporan
          <select value={reportId} onChange={(e) => setReportId(e.target.value)} required>
            <option value="">-- Pilih --</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                #{report.id} - {report.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          File Gambar
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload ke S3"}</button>
      </form>
    </section>
  );
}
