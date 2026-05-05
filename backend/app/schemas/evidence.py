from pydantic import BaseModel, Field


class PresignedUrlRequest(BaseModel):
    report_id: int
    file_extension: str = Field(min_length=3, max_length=8)


class PresignedUrlResponse(BaseModel):
    upload_url: str
    evidence_id: int
    expires_in_seconds: int


class ConfirmUploadRequest(BaseModel):
    evidence_id: int
    mime_type: str


class ConfirmUploadResponse(BaseModel):
    cloudfront_url: str
