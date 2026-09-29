"""
FastAPI REST and WebSocket Endpoints.
Serves real-time telemetry stream, SIH demo control (/api/demo/start, /api/demo/reset, /api/demo/step),
network state queries, authentication, user management, and security audit logs.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request, status, Header

from app.models.schemas import (
    DemoState, NetworkState, NetworkTopology,
    SimulationStartRequest, SimulationResetRequest, SimulationStatusResponse,
    SecurityLayer, SecurityOverviewResponse, SecurityLayerEvent,
    LoadBalancerStatusResponse, LoadBalancerDecisionResponse, ServerRiskUpdateRequest,
    TelemetryEvent, TelemetryStatsResponse, NetworkStatesResponse,
    AttackPathCurrentResponse, AttackPathPredictionResponse, LLMReasoningOutput,
    ObjectivesCurrentResponse, ObjectivesHistoryResponse,
    DefenceCurrentResponse, DefenceHistoryResponse,
    DeceptionStatusResponse, DeceptionEventsResponse, DeceptionActivateRequest, DeceptionActivateResponse,
    WSEventMessage, ClosedLoopStatusResponse, ClosedLoopStartRequest,
    LoginRequest, UserResponse, AuthSessionResponse, UserCreateRequest, UserRoleUpdateRequest, AuditLogResponse
)
from app.services.demo_runner import demo_runner
from app.services.network_simulation import network_simulation_engine
from app.services.security_matrix import security_matrix_engine
from app.services.load_balancer import load_balancer
from app.services.telemetry_pipeline import telemetry_pipeline
from app.services.attack_path_engine import attack_path_engine
from app.services.llm_reasoning import llm_reasoning_service
from app.services.objective_inference import objective_engine
from app.services.adaptive_defence import adaptive_defence_engine
from app.services.deception_engine import deception_engine
from app.services.websocket_manager import ws_manager
from app.services.closed_loop_orchestrator import closed_loop_orchestrator
from app.core.security import (
    create_token, verify_token, get_current_user, get_current_user_optional,
    require_permission, ROLE_PERMISSIONS
)
from app.db.database import hash_password
from app.db.repository import db_repo

logger = logging.getLogger("ABHEDYA-NET.API")

router = APIRouter()

# ============================================================
# WEBSOCKET STREAMING ENDPOINTS
# ============================================================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & accept incoming client messages if any
            data = await websocket.receive_text()
            logger.info(f"Received WS message: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WS connection error: {e}")
        ws_manager.disconnect(websocket)


@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json(demo_runner.demo_state.model_dump())
        while True:
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


async def broadcast_state(data: Dict[str, Any]):
    await ws_manager.broadcast_json(data)


@router.get("/health")
async def health_check():
    return {"status": "HEALTHY", "service": "Autonomous Cyber Deception Platform Backend"}


# ============================================================
# AUTHENTICATION & RBAC ENDPOINTS
# ============================================================

@router.post("/auth/login", response_model=AuthSessionResponse)
async def login(req: LoginRequest, request: Request):
    """Authenticates user against database with role-based session token."""
    email_clean = req.email.strip().lower()
    user = db_repo.get_user_by_email(email_clean)
    client_ip = request.client.host if request.client else "127.0.0.1"

    if not user:
        # Fallback creation for demo convenience if user doesn't exist
        if "@" in email_clean:
            role = "ADMIN" if "admin" in email_clean else "SECURITY_ENGINEER" if "engineer" in email_clean else "VIEWER" if "viewer" in email_clean else "SOC_ANALYST"
            user = db_repo.create_user(
                name=email_clean.split("@")[0].capitalize(),
                email=email_clean,
                role=role,
                password_hash=hash_password(req.password or "adminpassword123")
            )
        else:
            db_repo.log_audit(
                user=req.email,
                role="UNKNOWN",
                action="Login failed: user not found",
                target="/api/v1/auth/login",
                result="FAILED",
                ip=client_ip
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials: user not found"
            )

    if user.status != "ACTIVE":
        db_repo.log_audit(
            user=user.email,
            role=user.role,
            action="Login blocked: account disabled",
            target="/api/v1/auth/login",
            result="DENIED",
            ip=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is currently disabled or locked."
        )

    # Password check
    expected_hash = user.password_hash
    if req.password and hash_password(req.password) != expected_hash:
        # Check against common demo passwords
        valid_demo_passwords = ["adminpassword123", "analystpassword123", "engineerpassword123", "viewerpassword123", "password123"]
        if req.password not in valid_demo_passwords:
            db_repo.log_audit(
                user=user.email,
                role=user.role,
                action="Login attempt failed: bad password",
                target="/api/v1/auth/login",
                result="FAILED",
                ip=client_ip
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password provided."
            )

    token = create_token(user_id=user.id, email=user.email, role=user.role)
    permissions = ROLE_PERMISSIONS.get(user.role, [])

    db_repo.log_audit(
        user=user.email,
        role=user.role,
        action="User login successful",
        target="/api/v1/auth/login",
        result="SUCCESS",
        ip=client_ip,
        details=f"Authenticated as role {user.role}"
    )

    return AuthSessionResponse(
        token=token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            status=user.status,
            lastLogin=user.last_login or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        ),
        expiresAt=datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() + 86400, timezone.utc).isoformat(),
        environment="LOCAL DEFENCE LAB",
        permissions=permissions
    )


@router.get("/auth/me")
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Returns profile and role permissions for currently authenticated user."""
    db_user = db_repo.get_user_by_email(user["email"])
    role = user.get("role", "VIEWER")
    return {
        "user": {
            "id": user.get("sub"),
            "email": user.get("email"),
            "name": db_user.name if db_user else user.get("email", "").split("@")[0],
            "role": role,
            "status": db_user.status if db_user else "ACTIVE",
            "lastLogin": db_user.last_login if db_user else datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        },
        "permissions": ROLE_PERMISSIONS.get(role, [])
    }


@router.get("/users", response_model=List[UserResponse])
async def list_users(user: Dict[str, Any] = Depends(require_permission("manage_users"))):
    """Retrieves all system operators and users. Enforces ADMIN permission."""
    users = db_repo.get_users()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            status=u.status,
            lastLogin=u.last_login
        ) for u in users
    ]


@router.post("/users", response_model=UserResponse)
async def create_user_record(req: UserCreateRequest, user: Dict[str, Any] = Depends(require_permission("manage_users"))):
    """Creates a new operator account in the database. Enforces ADMIN permission."""
    created = db_repo.create_user(
        name=req.name,
        email=req.email,
        role=req.role,
        password_hash=hash_password(req.password or "password123")
    )
    db_repo.log_audit(
        user=user["email"],
        role=user["role"],
        action=f"Created user {req.email}",
        target="/api/v1/users",
        result="SUCCESS",
        details=f"Assigned initial role {req.role}"
    )
    return UserResponse(
        id=created.id,
        name=created.name,
        email=created.email,
        role=created.role,
        status=created.status,
        lastLogin=created.last_login
    )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role_record(user_id: str, req: UserRoleUpdateRequest, user: Dict[str, Any] = Depends(require_permission("manage_users"))):
    """Updates an operator's RBAC role. Enforces ADMIN permission."""
    updated = db_repo.update_user_role(user_id, req.role)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    db_repo.log_audit(
        user=user["email"],
        role=user["role"],
        action=f"Updated role for user {updated.email}",
        target=f"/api/v1/users/{user_id}/role",
        result="SUCCESS",
        details=f"New role: {req.role}"
    )
    return UserResponse(
        id=updated.id,
        name=updated.name,
        email=updated.email,
        role=updated.role,
        status=updated.status,
        lastLogin=updated.last_login
    )


@router.patch("/users/{user_id}/status", response_model=UserResponse)
async def toggle_user_status_record(user_id: str, user: Dict[str, Any] = Depends(require_permission("manage_users"))):
    """Toggles an operator's status (ACTIVE/DISABLED). Enforces ADMIN permission."""
    updated = db_repo.toggle_user_status(user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    db_repo.log_audit(
        user=user["email"],
        role=user["role"],
        action=f"Toggled status for user {updated.email}",
        target=f"/api/v1/users/{user_id}/status",
        result="SUCCESS",
        details=f"Status changed to {updated.status}"
    )
    return UserResponse(
        id=updated.id,
        name=updated.name,
        email=updated.email,
        role=updated.role,
        status=updated.status,
        lastLogin=updated.last_login
    )


@router.get("/audit/logs", response_model=List[AuditLogResponse])
async def get_audit_trail(limit: int = 50, user: Dict[str, Any] = Depends(require_permission("view_audit_logs"))):
    """Retrieves immutable audit trail from the database. Enforces ADMIN permission."""
    logs = db_repo.get_audit_logs(limit=limit)
    return [
        AuditLogResponse(
            id=l.id,
            timestamp=l.timestamp,
            user=l.user,
            role=l.role,
            action=l.action,
            target=l.target,
            result=l.result,
            ip=l.ip,
            details=l.details
        ) for l in logs
    ]


# ============================================================
# STAGE 2: CONTROLLED DEFENCE NETWORK & SIMULATION ENDPOINTS
# ============================================================

@router.get("/network/topology", response_model=NetworkTopology)
async def get_network_topology():
    """Retrieve current local defence network topology and 6 asset states."""
    return network_simulation_engine.get_topology()

@router.post("/simulation/start", response_model=SimulationStatusResponse)
async def start_simulation(req: Optional[SimulationStartRequest] = None, caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Start continuous local defence network simulation loop."""
    if caller and "control_simulation" not in ROLE_PERMISSIONS.get(caller.get("role", "VIEWER"), []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Lacks control_simulation permission")
    seed = req.seed if req else None
    tick_interval = req.tick_interval_sec if req else 1.0
    status_dict = network_simulation_engine.start(tick_interval_sec=tick_interval, seed=seed)
    return SimulationStatusResponse(**status_dict)

@router.post("/simulation/stop", response_model=SimulationStatusResponse)
async def stop_simulation(caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Stop background local defence network simulation."""
    if caller and "control_simulation" not in ROLE_PERMISSIONS.get(caller.get("role", "VIEWER"), []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Lacks control_simulation permission")
    status_dict = network_simulation_engine.stop()
    return SimulationStatusResponse(**status_dict)

@router.post("/simulation/reset", response_model=SimulationStatusResponse)
async def reset_simulation(req: Optional[SimulationResetRequest] = None, caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Reset network simulation assets and state with optional deterministic seed."""
    if caller and "control_simulation" not in ROLE_PERMISSIONS.get(caller.get("role", "VIEWER"), []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Lacks control_simulation permission")
    seed = req.seed if req else 42
    status_dict = network_simulation_engine.reset(seed=seed)
    return SimulationStatusResponse(**status_dict)

@router.get("/simulation/status", response_model=SimulationStatusResponse)
async def get_simulation_status():
    """Get real-time simulation metrics, tick count, active scenario, and event telemetry count."""
    status_dict = network_simulation_engine.get_status()
    return SimulationStatusResponse(**status_dict)

# ============================================================
# STAGE 3: DEFENCE-IN-DEPTH SECURITY ARCHITECTURE ENDPOINTS
# ============================================================

@router.get("/security/layers", response_model=List[SecurityLayer])
async def get_security_layers():
    """Retrieve all 9 Defense-in-Depth security layers with detailed controls."""
    return security_matrix_engine.get_layers()

@router.get("/security/overview", response_model=SecurityOverviewResponse)
async def get_security_overview():
    """Retrieve system security overview, total/active controls, risk score, and healthy layer counts."""
    return security_matrix_engine.get_overview()

@router.get("/security/events", response_model=List[SecurityLayerEvent])
async def get_security_events(limit: int = 50):
    """Retrieve recent security events across all 9 security architecture layers."""
    return security_matrix_engine.get_events(limit=limit)

# ============================================================
# STAGE 4: SECURITY-AWARE LOAD BALANCER ENDPOINTS
# ============================================================

@router.get("/load-balancer/status", response_model=LoadBalancerStatusResponse)
async def get_load_balancer_status():
    """Retrieve security-aware load balancer status, capacity metrics, and traffic allocations."""
    return load_balancer.get_status()

@router.get("/load-balancer/decision", response_model=LoadBalancerDecisionResponse)
async def get_load_balancer_decision():
    """Retrieve active routing decisions, traffic allocations, and explanation breakdown."""
    decision = load_balancer.get_decision()
    db_repo.persist_load_balancer_decision(decision.model_dump())
    return decision

@router.post("/load-balancer/update-risk", response_model=LoadBalancerStatusResponse)
async def update_server_risk(
    req: ServerRiskUpdateRequest,
    request: Request,
    caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Dynamically update a server's security risk and observe dynamic traffic reallocation.
    Enforces RBAC when authenticated (rejects unauthorized roles such as VIEWER).
    """
    client_ip = request.client.host if request.client else "127.0.0.1"

    if caller:
        role = caller.get("role", "VIEWER")
        if "manage_load_balancer" not in ROLE_PERMISSIONS.get(role, []):
            db_repo.log_audit(
                user=caller.get("email", "unknown"),
                role=role,
                action="Attempted load balancer risk modification",
                target=f"/api/v1/load-balancer/update-risk (Server: {req.server_id})",
                result="DENIED",
                ip=client_ip,
                details=f"RBAC blocked: Role {role} lacks manage_load_balancer"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{role}' lacks permission 'manage_load_balancer'"
            )

    updated_status = load_balancer.update_server_risk(
        server_id=req.server_id,
        security_risk=req.security_risk,
        predicted_risk=req.predicted_risk
    )

    db_repo.log_audit(
        user=caller.get("email", "local_operator") if caller else "local_operator",
        role=caller.get("role", "ADMIN") if caller else "ADMIN",
        action=f"Updated risk on {req.server_id} to {req.security_risk:.2f}",
        target="/api/v1/load-balancer/update-risk",
        result="SUCCESS",
        ip=client_ip
    )

    return updated_status

# ============================================================
# STAGE 5: CONTINUOUS TELEMETRY PIPELINE & STATE TRANSITIONS
# ============================================================

@router.get("/telemetry/recent", response_model=List[TelemetryEvent])
async def get_recent_telemetry(limit: int = 50, source: Optional[str] = None):
    """Retrieve recent canonical telemetry events across all 7 ingestion sources."""
    return telemetry_pipeline.get_recent_events(limit=limit, source=source)

@router.get("/telemetry/stats", response_model=TelemetryStatsResponse)
async def get_telemetry_stats():
    """Retrieve real-time telemetry pipeline stats, per-source counts, and EPS ingestion rate."""
    return telemetry_pipeline.get_stats()

@router.get("/network/states", response_model=NetworkStatesResponse)
async def get_network_states(limit: int = 50):
    """Retrieve history of sequential NetworkState transitions (S1 -> S2 -> S3 -> S4)."""
    return telemetry_pipeline.get_state_history(limit=limit)

@router.get("/network/states/latest", response_model=NetworkState)
async def get_latest_network_state():
    """Retrieve current latest NetworkState S_t."""
    return telemetry_pipeline.get_latest_state()

# ============================================================
# JUDGE DEMO & WEBSOCKET STREAMING ENDPOINTS
# ============================================================

@router.get("/demo/state", response_model=DemoState)
async def get_demo_state():
    return demo_runner.demo_state

@router.post("/demo/start", response_model=DemoState)
async def start_judge_demo():
    demo_runner.trigger_demo(seed=42)
    return demo_runner.demo_state

@router.post("/demo/reset", response_model=DemoState)
async def reset_judge_demo():
    return demo_runner.reset_demo()

@router.post("/demo/step", response_model=DemoState)
async def advance_judge_demo():
    state = demo_runner.step_forward()
    await broadcast_state(state.model_dump())
    return state

# Explicit Stage 16 Deterministic Judge Demo Routes
@router.post("/judge-demo/trigger", response_model=DemoState)
async def trigger_deterministic_judge_demo(seed: int = 42):
    state = demo_runner.trigger_demo(seed=seed)
    await broadcast_state(state.model_dump())
    return state

@router.post("/judge-demo/step", response_model=DemoState)
async def step_deterministic_judge_demo():
    state = demo_runner.step_forward()
    await broadcast_state(state.model_dump())
    return state

@router.post("/judge-demo/reset", response_model=DemoState)
async def reset_deterministic_judge_demo():
    state = demo_runner.reset_demo()
    await broadcast_state(state.model_dump())
    return state

@router.get("/judge-demo/status", response_model=DemoState)
async def get_judge_demo_status():
    return demo_runner.demo_state

# ============================================================
# STAGE 8: ATTACK-PATH PREDICTION ENDPOINTS
# ============================================================

@router.get("/attack-path/current", response_model=AttackPathCurrentResponse)
async def get_attack_path_current():
    """
    Retrieve current dynamic AttackPath graph, MITRE ATT&CK node statuses, and edges.
    Derived dynamically from backend prediction engine.
    """
    path = attack_path_engine.analyze_attack_path()
    db_repo.persist_attack_path(path.model_dump())
    return AttackPathCurrentResponse(attack_path=path)

@router.get("/attack-path/prediction", response_model=AttackPathPredictionResponse)
async def get_attack_path_prediction():
    """
    Retrieve Stage 8 Attack Stage Prediction detailing current stage, predicted next stage,
    confidence score, overall risk, affected assets, and model version.
    """
    path = attack_path_engine.analyze_attack_path()
    states = telemetry_pipeline.get_state_history(limit=10).states
    state_seq = [s.state_id for s in states] if states else ["S1_init"]
    return AttackPathPredictionResponse(
        prediction=path.prediction,
        network_state_sequence=state_seq
    )

# ============================================================
# STAGE 9: LLM REASONING LAYER ENDPOINTS
# ============================================================

@router.get("/reasoning/latest", response_model=LLMReasoningOutput)
async def get_latest_reasoning():
    """
    Retrieve latest structured LLM Reasoning output (objectives, evidence, action recommendations).
    """
    return await llm_reasoning_service.analyze()

@router.post("/reasoning/analyze", response_model=LLMReasoningOutput)
async def trigger_reasoning_analysis():
    """
    Trigger a fresh analysis run on the active LLM Reasoning Provider.
    Returns strictly validated Pydantic JSON output.
    """
    return await llm_reasoning_service.analyze()

# ============================================================
# STAGE 10: MULTI-HYPOTHESIS OBJECTIVE INFERENCE ENDPOINTS
# ============================================================

@router.get("/objectives/current", response_model=ObjectivesCurrentResponse)
async def get_current_objectives():
    """
    Retrieve current multi-hypothesis adversary objective probabilities, deltas, and evidence lists.
    """
    objectives_res = objective_engine.get_current_objectives()
    return objectives_res

@router.get("/objectives/history", response_model=ObjectivesHistoryResponse)
async def get_objectives_history():
    """
    Retrieve historical sequence of adversary objective probability distributions over time.
    """
    return objective_engine.get_objectives_history()

# ============================================================
# STAGE 12: ADAPTIVE DEFENCE ENGINE ENDPOINTS
# ============================================================

@router.get("/defence/current", response_model=DefenceCurrentResponse)
async def get_current_defence():
    """
    Retrieve current validated adaptive defence decision (multi-action target recommendations,
    evidence attributions, policy engine checks).
    """
    res = adaptive_defence_engine.get_current_decision()
    db_repo.persist_defence_decision(res.decision.model_dump())
    return res

@router.get("/defence/history", response_model=DefenceHistoryResponse)
async def get_defence_history():
    """
    Retrieve historical sequence of validated adaptive defence decisions over time.
    """
    return adaptive_defence_engine.get_defence_history()

# ============================================================
# STAGE 13: SECURE ADAPTIVE DECEPTION ENGINE ENDPOINTS
# ============================================================

@router.post("/deception/activate", response_model=DeceptionActivateResponse)
async def activate_deception_environment(
    req: Optional[DeceptionActivateRequest] = None,
    request: Request = None,
    caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Activate the isolated deception zone (Adaptive Decoy DB, Decoy API, Decoy Admin).
    Enforces policy validation constraint and RBAC authorization (manage_deception).
    """
    client_ip = request.client.host if request and request.client else "127.0.0.1"

    if caller:
        role = caller.get("role", "VIEWER")
        if "manage_deception" not in ROLE_PERMISSIONS.get(role, []):
            db_repo.log_audit(
                user=caller.get("email", "unknown"),
                role=role,
                action="Attempted deception activation",
                target="/api/v1/deception/activate",
                result="DENIED",
                ip=client_ip,
                details=f"RBAC blocked: Role {role} lacks manage_deception"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{role}' lacks permission 'manage_deception'"
            )

    policy_validated = req.policy_validated if req else True
    res = deception_engine.activate_deception(policy_validated=policy_validated)

    # Persist deception state and audit record
    db_repo.persist_deception_interaction({
        "event_id": f"dec-act-{int(datetime.now(timezone.utc).timestamp())}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_ip": client_ip,
        "target_decoy": "Adaptive Decoy Database (Port 5433)",
        "decoy_port": 5433,
        "protocol": "PostgreSQL",
        "payload_summary": "Decoy zone activated; synthetic activity online",
        "severity": "INFO"
    })

    db_repo.log_audit(
        user=caller.get("email", "local_operator") if caller else "local_operator",
        role=caller.get("role", "ADMIN") if caller else "ADMIN",
        action="Activated Deception Zone (VLAN 99)",
        target="/api/v1/deception/activate",
        result="SUCCESS",
        ip=client_ip,
        details="Decoys active on ports 5433, 8081, 8082"
    )

    return res

@router.post("/deception/deactivate", response_model=DeceptionStatusResponse)
async def deactivate_deception_environment(
    caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Deactivate the deception environment and return decoys to standby isolation.
    """
    if caller and "manage_deception" not in ROLE_PERMISSIONS.get(caller.get("role", "VIEWER"), []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Lacks permission 'manage_deception'"
        )
    return deception_engine.deactivate_deception()

@router.get("/deception/status", response_model=DeceptionStatusResponse)
async def get_deception_status():
    """
    Retrieve current deception zone isolation status, realism indicators, fingerprint risk,
    active decoy services, and background synthetic activity.
    """
    return deception_engine.get_deception_status()

@router.get("/deception/events", response_model=DeceptionEventsResponse)
async def get_deception_events():
    """
    Retrieve captured attacker decoy interaction events.
    """
    return deception_engine.get_deception_events()

# ============================================================
# STAGE 14: CLOSED-LOOP ADAPTATION ENDPOINTS
# ============================================================

@router.post("/closed-loop/start", response_model=ClosedLoopStatusResponse)
async def start_closed_loop(
    req: Optional[ClosedLoopStartRequest] = None,
    caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Start continuous real-time closed-loop adaptation loop broadcasting live WebSocket events.
    """
    if caller and "control_simulation" not in ROLE_PERMISSIONS.get(caller.get("role", "VIEWER"), []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Lacks control_simulation permission")
    interval_sec = req.interval_sec if req else 2.0
    return closed_loop_orchestrator.start_loop(interval_sec=interval_sec)

@router.post("/closed-loop/stop", response_model=ClosedLoopStatusResponse)
async def stop_closed_loop(
    caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Pause continuous closed-loop adaptation loop.
    """
    if caller and "control_simulation" not in ROLE_PERMISSIONS.get(caller.get("role", "VIEWER"), []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Lacks control_simulation permission")
    return closed_loop_orchestrator.stop_loop()

@router.post("/closed-loop/step")
async def execute_closed_loop_single_step(
    caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Manually trigger a single complete pass of the 10-stage closed-loop adaptation pipeline.
    """
    if caller and "control_simulation" not in ROLE_PERMISSIONS.get(caller.get("role", "VIEWER"), []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Lacks control_simulation permission")
    return await closed_loop_orchestrator.execute_closed_loop_step()


@router.get("/closed-loop/status", response_model=ClosedLoopStatusResponse)
async def get_closed_loop_status():
    """
    Retrieve status of closed-loop adaptation orchestrator.
    """
    return closed_loop_orchestrator.get_status()


# ============================================================
# LIVE TESTBED & 3-MODE ADAPTATION ENDPOINTS
# ============================================================
from app.services.live_testbed import live_testbed

@router.post("/mode/set")
async def set_operational_mode(req: Dict[str, str]):
    """Switches operational mode: LIVE_CONTROLLED_TEST, DATASET_REPLAY, JUDGE_DEMO."""
    mode = req.get("mode", "LIVE_CONTROLLED_TEST")
    return live_testbed.set_mode(mode)

@router.get("/mode/status")
async def get_mode_status():
    """Retrieves live sensor statuses and current mode."""
    return live_testbed.get_system_status()

@router.post("/live-testbed/step")
async def execute_live_testbed_cycle():
    """Executes one complete pass of the Live Controlled Testbed pipeline."""
    return await live_testbed.execute_live_cycle()

@router.post("/live-testbed/reset")
async def reset_live_testbed():
    """Resets live testbed environment, decoys, and state to nominal baseline."""
    return live_testbed.reset_environment()

@router.get("/live-testbed/timeline")
async def get_live_testbed_timeline():
    """Returns the visible live event timeline."""
    return live_testbed.event_timeline

@router.post("/dataset-replay/step")
async def execute_dataset_replay_step():
    """Replays one frame from the benchmark dataset."""
    return await live_testbed.execute_dataset_replay_step()

@router.post("/deception/decoy-api")
async def decoy_api_trap(req: Optional[Dict[str, Any]] = None):
    """
    Isolated Decoy API Endpoint (Honeytrap).
    Immediately captures attacker probe, logs interaction, and returns synthetic response.
    """
    from app.services.test_client import controlled_test_client
    evt = controlled_test_client.generate_decoy_interaction("api")
    return {
        "status": "TRAPPED_AND_LOGGED",
        "decoy": "Adaptive Decoy Admin API",
        "isolation": "VLAN 99 ISOLATED - ZERO PRODUCTION PATH",
        "synthetic_payload": {"token": "synth_fake_jwt_token_999", "admin": True}
    }

@router.post("/deception/decoy-db")
async def decoy_db_trap(req: Optional[Dict[str, Any]] = None):
    """
    Isolated Decoy Database Endpoint (Honeytrap).
    Captures SQL injection / exfiltration query, generates feedback event, and returns synthetic rows.
    """
    from app.services.test_client import controlled_test_client
    evt = controlled_test_client.generate_decoy_interaction("database")
    return {
        "status": "TRAPPED_AND_LOGGED",
        "decoy": "Adaptive Decoy PostgreSQL (Port 5433)",
        "isolation": "VLAN 99 ISOLATED - ZERO REAL DATA EXPOSED",
        "synthetic_rows": [
            {"id": 1, "user": "synth_user_alpha", "dummy_flag": "FLAG{DECOY_CAPTURED_ATTACKER}"}
        ]
    }

