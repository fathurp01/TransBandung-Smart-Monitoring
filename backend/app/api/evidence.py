from uuid import uuid4

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.db.database import get_db
from app.dependencies import get_app_settings
from app.models.evidence import EvidenceFile
from app.models.report import Report
from app.schemas.evidence import (
    ConfirmUploadRequest,
    ConfirmUploadResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
)

router = APIRouter(prefix="/api/evidence", tags=["evidence"])


@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_url(
    payload: PresignedUrlRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
):
    report = db.query(Report).filter(Report.id == payload.report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )

    safe_ext = payload.file_extension.lower().replace(".", "")
    if safe_ext not in {"jpg", "jpeg", "png", "webp"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file extension"
        )

    s3_key = f"reports/{payload.report_id}/{uuid4()}.{safe_ext}"
    s3_client = boto3.client("s3", region_name=settings.aws_region)

    try:
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.s3_bucket,
                "Key": s3_key,
                "ContentType": f"image/{safe_ext if safe_ext != 'jpg' else 'jpeg'}",
            },
            ExpiresIn=settings.upload_expiry_seconds,
            HttpMethod="PUT",
        )
    except ClientError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate upload URL: {exc}"
        ) from exc

    evidence = EvidenceFile(
        report_id=payload.report_id, s3_key=s3_key, upload_status="pending"
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return PresignedUrlResponse(
        upload_url=upload_url,
        evidence_id=evidence.id,
        expires_in_seconds=settings.upload_expiry_seconds,
    )


@router.post("/confirm-upload", response_model=ConfirmUploadResponse)
def confirm_upload(
    payload: ConfirmUploadRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
):
    evidence = (
        db.query(EvidenceFile).filter(EvidenceFile.id == payload.evidence_id).first()
    )
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found"
        )

    evidence.upload_status = "completed"
    evidence.mime_type = payload.mime_type
    evidence.cloudfront_url = f"https://{settings.cloudfront_domain}/{evidence.s3_key}"
    db.commit()

    return ConfirmUploadResponse(cloudfront_url=evidence.cloudfront_url)
