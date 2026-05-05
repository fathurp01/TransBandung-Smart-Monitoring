from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.dependencies import verify_admin_token
from app.models.report import Report
from app.schemas.report import ReportOut, ReportStatusUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get(
    "/reports",
    response_model=list[ReportOut],
    dependencies=[Depends(verify_admin_token)],
)
def list_reports_admin(db: Session = Depends(get_db)):
    reports = (
        db.query(Report)
        .options(joinedload(Report.evidence_files))
        .order_by(Report.id.desc())
        .all()
    )
    return reports


@router.patch(
    "/reports/{report_id}/status",
    response_model=ReportOut,
    dependencies=[Depends(verify_admin_token)],
)
def update_report_status(
    report_id: int, payload: ReportStatusUpdate, db: Session = Depends(get_db)
):
    report = (
        db.query(Report)
        .options(joinedload(Report.evidence_files))
        .filter(Report.id == report_id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )

    report.status = payload.status
    report.admin_notes = payload.admin_notes
    db.commit()
    db.refresh(report)
    return report
