from sqlalchemy import Column, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from app.db.database import Base


class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String(20), unique=True, nullable=False, index=True)
    route_name = Column(String(100), nullable=False)
    operator = Column(String(100), nullable=False)

    schedules = relationship(
        "RouteSchedule", back_populates="route", cascade="all, delete-orphan"
    )


class RouteSchedule(Base):
    __tablename__ = "route_schedules"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(
        Integer, ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False
    )
    departure_time = Column(Time, nullable=False)
    arrival_time = Column(Time, nullable=False)
    day_of_week = Column(Integer, nullable=False)

    route = relationship("TransportRoute", back_populates="schedules")
