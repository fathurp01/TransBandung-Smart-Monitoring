from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings


def get_app_settings() -> Settings:
    return get_settings()


def verify_admin_token(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_app_settings),
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin token"
        )

    return "admin"
