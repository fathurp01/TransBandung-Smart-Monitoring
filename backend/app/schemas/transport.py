from datetime import time

from pydantic import BaseModel


class RouteScheduleOut(BaseModel):
    id: int
    departure_time: time
    arrival_time: time
    day_of_week: int

    model_config = {"from_attributes": True}


class TransportRouteOut(BaseModel):
    id: int
    route_code: str
    route_name: str
    operator: str
    schedules: list[RouteScheduleOut] = []

    model_config = {"from_attributes": True}
