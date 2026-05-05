import datetime as dt

from sqlalchemy import Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    report_type = Column(
        Enum("traffic_jam", "accident", "other", name="report_type_enum"),
        nullable=False,
        default="traffic_jam",
        index=True,
    )
    status = Column(
        Enum("pending", "verified", "resolved", "dismissed", name="report_status_enum"),
        nullable=False,
        default="pending",
        index=True,
    )
    submitted_by = Column(String(100), nullable=False)
    submitted_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow)
    admin_notes = Column(Text, nullable=True)

    evidence_files = relationship(
        "EvidenceFile", back_populates="report", cascade="all, delete-orphan"
    )
