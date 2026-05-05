import { useEffect, useState } from "react";

import AdminDashboard from "./components/AdminDashboard";
import EvidenceUpload from "./components/EvidenceUpload";
import ReportForm from "./components/ReportForm";
import TransportMonitor from "./components/TransportMonitor";
import api from "./services/api";

export default function App() {
  const [routes, setRoutes] = useState([]);
  const [reports, setReports] = useState([]);

  async function loadData() {
    const [routesResponse, reportsResponse] = await Promise.all([
      api.get("/api/routes"),
      api.get("/api/reports"),
    ]);
    setRoutes(routesResponse.data);
    setReports(reportsResponse.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleCreated(report) {
    setReports((prev) => [report, ...prev]);
  }

  function handleUploaded(reportId, cloudfrontUrl) {
    setReports((prev) =>
      prev.map((report) => {
        if (report.id !== reportId) return report;
        return {
          ...report,
          evidence_files: [
            ...(report.evidence_files || []),
            {
              id: Date.now(),
              cloudfront_url: cloudfrontUrl,
              upload_status: "completed",
              mime_type: "image/jpeg",
            },
          ],
        };
      })
    );
  }

  function handleStatusUpdated(updatedReport) {
    setReports((prev) => prev.map((r) => (r.id === updatedReport.id ? updatedReport : r)));
  }

  return (
    <main className="app">
      <h1>TransBandung Smart Monitoring (TBSM)</h1>
      <TransportMonitor routes={routes} />
      <ReportForm onCreated={handleCreated} />
      <EvidenceUpload reports={reports} onUploaded={handleUploaded} />
      <AdminDashboard reports={reports} onStatusUpdated={handleStatusUpdated} />
    </main>
  );
}
