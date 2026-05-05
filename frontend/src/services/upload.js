import api from "./api";

export async function uploadEvidence(reportId, file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

  const presigned = await api.post("/api/evidence/presigned-url", {
    report_id: reportId,
    file_extension: extension,
  });

  const { upload_url, evidence_id } = presigned.data;

  await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  const confirmation = await api.post("/api/evidence/confirm-upload", {
    evidence_id,
    mime_type: file.type,
  });

  return confirmation.data.cloudfront_url;
}
