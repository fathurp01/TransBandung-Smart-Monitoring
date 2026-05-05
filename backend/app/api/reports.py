from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportOut

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    reports = (
        db.query(Report)
        .options(joinedload(Report.evidence_files))
        .order_by(Report.id.desc())
        .all()
    )
    return reports


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    report = Report(**payload.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    report_with_evidence = (
        db.query(Report)
        .options(joinedload(Report.evidence_files))
        .filter(Report.id == report.id)
        .first()
    )
    if not report_with_evidence:
        raise HTTPException(status_code=500, detail="Failed to load created report")
    return report_with_evidence
