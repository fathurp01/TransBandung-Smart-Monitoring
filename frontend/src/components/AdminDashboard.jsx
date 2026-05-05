import { useState } from "react";

import api from "../services/api";

export default function AdminDashboard({ reports, onStatusUpdated }) {
  const [token, setToken] = useState("");

  async function updateStatus(reportId, status) {
    const response = await api.patch(
      `/api/admin/reports/${reportId}/status`,
      { status, admin_notes: `Status diubah ke ${status}` },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    onStatusUpdated(response.data);
  }

  return (
    <section>
      <h2>Dashboard Admin</h2>
      <label>
        Admin Token
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer token"
        />
      </label>

      <div className="list">
        {reports.map((report) => (
          <div key={report.id} className="card">
            <div>
              <strong>#{report.id} - {report.title}</strong>
            </div>
            <div>Status: {report.status}</div>
            <div>Lokasi: {report.location}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => updateStatus(report.id, "verified")}>Verify</button>
              <button type="button" onClick={() => updateStatus(report.id, "resolved")}>Resolve</button>
              <button type="button" onClick={() => updateStatus(report.id, "dismissed")}>Dismiss</button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {report.evidence_files?.map((evidence) =>
                evidence.cloudfront_url ? (
                  <img key={evidence.id} src={evidence.cloudfront_url} alt="Evidence" className="evidence-img" />
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
