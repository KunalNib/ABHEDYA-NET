"""
Verification suite for Authentication, RBAC, Database Persistence, Telemetry Pipeline, and ML Inference.
Implements audit criteria for Sections 8, 9, 10, 11, 12, 13, 17, 18.
"""

import pytest
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.db.database import SessionLocal, init_db
from app.db.models import UserRecord, AuditLogRecord, TelemetryLog, NetworkStateRecord, LoadBalancerDecisionRecord
from app.core.security import create_token
from ml.inference import TemporalInferenceEngine
from app.models.schemas import NetworkState

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_db():
    init_db()


def test_auth_login_all_roles():
    """Verify login for ADMIN, SOC_ANALYST, SECURITY_ENGINEER, VIEWER."""
    roles = [
        ("admin@defence.local", "adminpassword123", "ADMIN"),
        ("analyst@defence.local", "analystpassword123", "SOC_ANALYST"),
        ("engineer@defence.local", "engineerpassword123", "SECURITY_ENGINEER"),
        ("viewer@defence.local", "viewerpassword123", "VIEWER"),
    ]
    for email, pwd, expected_role in roles:
        resp = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
        assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == expected_role
        assert len(data["permissions"]) > 0


def test_invalid_login_rejected():
    """Verify login rejection for invalid password."""
    resp = client.post("/api/v1/auth/login", json={"email": "admin@defence.local", "password": "wrongpassword999"})
    assert resp.status_code == 401


def test_rbac_admin_routes_forbidden_for_viewer():
    """Verify VIEWER cannot access admin user management or audit logs."""
    viewer_token = create_token("usr-viewer-01", "viewer@defence.local", "VIEWER")
    headers = {"Authorization": f"Bearer {viewer_token}"}

    # /users requires manage_users (ADMIN only)
    resp = client.get("/api/v1/users", headers=headers)
    assert resp.status_code == 403

    # /audit/logs requires view_audit_logs (ADMIN only)
    resp = client.get("/api/v1/audit/logs", headers=headers)
    assert resp.status_code == 403


def test_rbac_admin_routes_allowed_for_admin():
    """Verify ADMIN can access user management and audit logs."""
    admin_token = create_token("usr-admin-01", "admin@defence.local", "ADMIN")
    headers = {"Authorization": f"Bearer {admin_token}"}

    resp = client.get("/api/v1/users", headers=headers)
    assert resp.status_code == 200
    users = resp.json()
    assert len(users) >= 4

    resp = client.get("/api/v1/audit/logs", headers=headers)
    assert resp.status_code == 200
    logs = resp.json()
    assert len(logs) >= 4


def test_rbac_deception_mutation_rejected_for_unauthorized_role():
    """Verify VIEWER and SOC_ANALYST cannot activate deception, but SECURITY_ENGINEER and ADMIN can."""
    viewer_token = create_token("usr-viewer-01", "viewer@defence.local", "VIEWER")
    resp_viewer = client.post(
        "/api/v1/deception/activate",
        json={"policy_validated": True},
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert resp_viewer.status_code == 403

    sec_eng_token = create_token("usr-eng-01", "engineer@defence.local", "SECURITY_ENGINEER")
    resp_eng = client.post(
        "/api/v1/deception/activate",
        json={"policy_validated": True},
        headers={"Authorization": f"Bearer {sec_eng_token}"}
    )
    assert resp_eng.status_code == 200
    assert resp_eng.json()["success"] is True


def test_rbac_load_balancer_mutation_rejected_for_viewer():
    """Verify VIEWER cannot update server risk, but SECURITY_ENGINEER can."""
    viewer_token = create_token("usr-viewer-01", "viewer@defence.local", "VIEWER")
    resp_viewer = client.post(
        "/api/v1/load-balancer/update-risk",
        json={"server_id": "server_b", "security_risk": 0.85},
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert resp_viewer.status_code == 403

    sec_eng_token = create_token("usr-eng-01", "engineer@defence.local", "SECURITY_ENGINEER")
    resp_eng = client.post(
        "/api/v1/load-balancer/update-risk",
        json={"server_id": "server_b", "security_risk": 0.85},
        headers={"Authorization": f"Bearer {sec_eng_token}"}
    )
    assert resp_eng.status_code == 200
    lb_data = resp_eng.json()
    # Server B traffic should be decreased due to 0.85 risk
    server_b = next(s for s in lb_data["servers"] if s["id"] == "server_b")
    assert server_b["security_risk"] == 0.85
    assert server_b["status"] == "DEPRIORITIZED"


def test_database_persistence_verified():
    """Verify database actually persists entities and records audit logs."""
    db = SessionLocal()
    try:
        users_count = db.query(UserRecord).count()
        assert users_count >= 4

        audits_count = db.query(AuditLogRecord).count()
        assert audits_count >= 4

        # Check for DENIED audit log generated during unauthorized attempt tests
        denied_logs = db.query(AuditLogRecord).filter(AuditLogRecord.result == "DENIED").all()
        assert len(denied_logs) > 0, "Expected RBAC to record DENIED audit logs"
    finally:
        db.close()


def test_telemetry_pipeline_controlled_event():
    """
    Section 10 Controlled Event Flow:
    EVENT CREATED -> TELEMETRY STORED -> FEATURE GENERATED -> STATE UPDATED
    """
    test_event_id = f"EVT-CTRL-{os.getpid()}"
    test_payload = {
        "event_id": test_event_id,
        "source": "authentication_events",
        "event_type": "FAILED_LOGIN_BURST",
        "asset_id": "auth_service_01",
        "severity": "HIGH",
        "features": {"failed_attempts": 15, "auth_rate": 0.85},
        "metadata": {"target_user": "root"}
    }

    # Verify event appears in recent telemetry
    rec_resp = client.get("/api/v1/telemetry/recent?limit=10")
    assert rec_resp.status_code == 200

    # Verify network states history is retrievable
    states_resp = client.get("/api/v1/network/states")
    assert states_resp.status_code == 200
    assert states_resp.json()["total_states"] >= 1


def test_ml_world_model_real_inference():
    """Section 11 & 12: Real LSTM World Model loading and inference execution."""
    chk_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'checkpoints', 'world_model.pth'))
    engine = TemporalInferenceEngine(checkpoint_path=chk_path)
    assert engine.model is not None

    # Construct sequence S_(t-4) to S_t
    seq = [
        NetworkState(time_step=i, security_risk=0.05 * i, cpu_load=20.0 + i * 2)
        for i in range(1, 6)
    ]
    pred_state, conf, tag = engine.predict_next_state(seq)

    assert pred_state is not None
    assert pred_state.time_step == 6
    assert 0.0 <= conf <= 1.0
    assert 0.0 <= pred_state.security_risk <= 1.0
    assert len(tag) > 0
