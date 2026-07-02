import os
import json
import pytest

# Enforce TESTING mode before importing app
os.environ["TESTING"] = "true"

from app import app, PlanRequest

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False  # Disable rate limits for routing tests
    with app.test_client() as client:
        yield client

def test_index_page(client):
    """Test that the frontend home page loads correctly."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"SprintMind" in response.data
    assert b"theme-cyberpunk" in response.data

def test_security_headers_present(client):
    """Verify standard security headers are attached in the response."""
    response = client.get("/")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in response.headers
    assert "default-src 'self'" in response.headers.get("Content-Security-Policy")

def test_generate_plan_empty_goal(client):
    """Test API rejects empty goal input."""
    payload = {
        "goal": "     ",
        "timeframe": "4 weeks",
        "hours_per_week": 10.0
    }
    response = client.post("/api/generate-plan", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "Validation failed" in data.get("error")

def test_generate_plan_invalid_hours(client):
    """Test API rejects negative hours or excessive hours."""
    # Negative hours
    payload = {
        "goal": "Write a research paper",
        "timeframe": "1 month",
        "hours_per_week": -2.5
    }
    response = client.post("/api/generate-plan", json=payload)
    assert response.status_code == 400

    # Over 168 hours a week
    payload["hours_per_week"] = 200.0
    response = client.post("/api/generate-plan", json=payload)
    assert response.status_code == 400

def test_generate_plan_missing_params(client):
    """Test API rejects payload missing required attributes."""
    payload = {
        "goal": "Submit coding assignment"
    }
    response = client.post("/api/generate-plan", json=payload)
    assert response.status_code == 400

def test_pydantic_validator_logic():
    """Verify input validation boundaries on the Pydantic schema class."""
    from pydantic import ValidationError

    # Valid schema setup
    req = PlanRequest(goal="Complete machine learning course", timeframe="6 weeks", hours_per_week=15.0)
    assert req.goal == "Complete machine learning course"
    assert req.timeframe == "6 weeks"
    assert req.hours_per_week == 15.0

    # Zero hours should fail
    with pytest.raises(ValidationError):
        PlanRequest(goal="Goal", timeframe="Week", hours_per_week=0.0)

    # Empty strings should fail
    with pytest.raises(ValidationError):
        PlanRequest(goal="   ", timeframe="Week", hours_per_week=10)
