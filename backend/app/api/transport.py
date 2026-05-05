from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.transportation import TransportRoute
from app.schemas.transport import TransportRouteOut

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("", response_model=list[TransportRouteOut])
def list_routes(db: Session = Depends(get_db)):
    routes = (
        db.query(TransportRoute).options(joinedload(TransportRoute.schedules)).all()
    )
    return routes
