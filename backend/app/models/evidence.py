import datetime as dt

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    s3_key = Column(String(500), nullable=False, unique=True, index=True)
    cloudfront_url = Column(String(500), nullable=True)
    mime_type = Column(String(64), nullable=True)
    upload_status = Column(
        Enum("pending", "completed", "failed", name="upload_status_enum"),
        nullable=False,
        default="pending",
    )
    created_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow)

    report = relationship("Report", back_populates="evidence_files")
