from fastapi.testclient import TestClient

from app.main import app


def test_create_report() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/reports",
            json={
                "title": "Kemacetan Dago",
                "description": "Macet parah sekitar terminal",
                "location": "Dago, Bandung",
                "report_type": "traffic_jam",
                "submitted_by": "warga01",
            },
        )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Kemacetan Dago"
    assert body["status"] == "pending"
