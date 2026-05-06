from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TransBandung Smart Monitoring API"
    app_env: str = "development"

    # Database (RDS)
    database_url: str = "sqlite:///./tbsm.db"

    # AWS Configuration
    aws_region: str = "ap-southeast-1"
    s3_bucket: str = "tbsm-evidence-local"
    cloudfront_domain: str = "d111111abcdef8.cloudfront.net"
    upload_expiry_seconds: int = 900

    # Admin authentication
    admin_token: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
