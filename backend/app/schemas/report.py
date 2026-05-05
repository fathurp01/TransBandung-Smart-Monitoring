from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5)
    location: str = Field(min_length=3, max_length=255)
    report_type: Literal["traffic_jam", "accident", "other"] = "traffic_jam"
    submitted_by: str = Field(min_length=2, max_length=100)


class EvidenceOut(BaseModel):
    id: int
    cloudfront_url: str | None = None
    mime_type: str | None = None
    upload_status: str

    model_config = {"from_attributes": True}


class ReportOut(BaseModel):
    id: int
    title: str
    description: str
    location: str
    report_type: str
    status: str
    submitted_by: str
    submitted_at: datetime
    admin_notes: str | None = None
    evidence_files: list[EvidenceOut] = []

    model_config = {"from_attributes": True}


class ReportStatusUpdate(BaseModel):
    status: Literal["verified", "resolved", "dismissed"]
    admin_notes: str | None = Field(default=None, max_length=500)
