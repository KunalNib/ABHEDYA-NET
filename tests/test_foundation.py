"""
Automated Pytest suite for ABHEDYA-NET Stage 1 Foundation.
Tests /health, /api/v1/system/status, and database connectivity.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import app
from app.db.database import check_database_connection

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["platform"] == "ABHEDYA-NET"
    assert "timestamp" in data

def test_system_status_endpoint():
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "ABHEDYA-NET"
    assert data["status"] in ["operational", "degraded"]
    assert "components" in data
    assert data["components"]["data_plane"] == "operational"

def test_database_connection():
    assert check_database_connection() is True
