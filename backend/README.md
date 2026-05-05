# Backend (FastAPI)

## Run locally

1. Create virtual environment and install dependencies.
2. Copy `.env.example` to `.env` and adjust values.
3. Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Main endpoints

- `GET /api/health`
- `GET /api/routes`
- `GET /api/reports`
- `POST /api/reports`
- `POST /api/evidence/presigned-url`
- `POST /api/evidence/confirm-upload`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/{report_id}/status`
