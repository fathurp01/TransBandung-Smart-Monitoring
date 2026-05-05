from datetime import time

from fastapi import FastAPI

from app.api.admin import router as admin_router
from app.api.evidence import router as evidence_router
from app.api.health import router as health_router
from app.api.reports import router as reports_router
from app.api.transport import router as transport_router
from app.config import get_settings
from app.db.database import Base, SessionLocal, engine
from app.models.transportation import RouteSchedule, TransportRoute

settings = get_settings()
app = FastAPI(title=settings.app_name)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

    # Seed minimal transport data for demo readiness.
    db = SessionLocal()
    try:
        existing = db.query(TransportRoute).count()
        if existing == 0:
            route = TransportRoute(
                route_code="TMB-01",
                route_name="Dago - Leuwipanjang",
                operator="Trans Metro",
            )
            db.add(route)
            db.flush()
            db.add_all(
                [
                    RouteSchedule(
                        route_id=route.id,
                        departure_time=time(6, 0),
                        arrival_time=time(6, 45),
                        day_of_week=1,
                    ),
                    RouteSchedule(
                        route_id=route.id,
                        departure_time=time(12, 0),
                        arrival_time=time(12, 45),
                        day_of_week=1,
                    ),
                    RouteSchedule(
                        route_id=route.id,
                        departure_time=time(18, 0),
                        arrival_time=time(18, 45),
                        day_of_week=1,
                    ),
                ]
            )
            db.commit()
    finally:
        db.close()


app.include_router(health_router)
app.include_router(transport_router)
app.include_router(reports_router)
app.include_router(evidence_router)
app.include_router(admin_router)
