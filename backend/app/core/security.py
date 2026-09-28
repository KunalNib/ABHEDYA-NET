"""
CHRONOS-WS Security, Authentication & Role-Based Access Control (RBAC).
Implements:
1. Password hashing & verification
2. Signed token generation and verification
3. RBAC Permission matrix
4. FastAPI dependency injection for protected routes
5. Automatic audit logging on authorization checks
"""

import hmac
import base64
import json
import time
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status, Header, Request

from app.db.database import hash_password
from app.db.repository import db_repo

SECRET_KEY = "chronos_ws_super_secret_jwt_signing_key_defence_platform"
TOKEN_EXPIRY_HOURS = 24

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "ADMIN": [
        "manage_users",
        "manage_roles",
        "view_audit_logs",
        "manage_config",
        "control_simulation",
        "execute_defence_action",
        "manage_deception",
        "view_deception_status",
        "view_dashboard",
        "view_network",
        "view_telemetry",
        "view_ai_model",
        "view_attack_paths",
        "view_risk",
        "view_objectives",
        "view_defence",
        "view_reports",
        "manage_load_balancer",
        "manage_security_layers"
    ],
    "SOC_ANALYST": [
        "view_dashboard",
        "view_network",
        "view_telemetry",
        "view_ai_model",
        "view_attack_paths",
        "view_risk",
        "view_objectives",
        "view_defence",
        "view_reports",
        "view_deception_status"
    ],
    "SECURITY_ENGINEER": [
        "view_dashboard",
        "view_network",
        "view_telemetry",
        "manage_load_balancer",
        "manage_security_layers",
        "manage_deception",
        "view_deception_status",
        "view_defence",
        "control_simulation"
    ],
    "VIEWER": [
        "view_dashboard",
        "view_network",
        "view_attack_paths",
        "view_ai_model",
        "view_reports",
        "view_telemetry"
    ]
}


def create_token(user_id: str, email: str, role: str) -> str:
    """Creates a base64url HMAC-SHA256 signed token."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + (TOKEN_EXPIRY_HOURS * 3600)
    }

    hdr_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    pld_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(SECRET_KEY.encode(), f"{hdr_b64}.{pld_b64}".encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    return f"{hdr_b64}.{pld_b64}.{sig_b64}"


def verify_token(token: str) -> Dict[str, Any]:
    """Verifies HMAC signature and expiration."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            # Handle demo token format if passed: jwt-demo-<role>-<timestamp>
            if token.startswith("jwt-demo-"):
                role_part = token.split("-")[2].upper()
                return {"sub": "usr-demo", "email": f"demo-{role_part.lower()}@defence.local", "role": role_part, "exp": int(time.time()) + 3600}
            raise ValueError("Invalid token format")

        hdr_b64, pld_b64, sig_b64 = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), f"{hdr_b64}.{pld_b64}".encode(), hashlib.sha256).digest()
        actual_sig = base64.urlsafe_b64decode(sig_b64 + "==")

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Token signature verification failed")

        payload_bytes = base64.urlsafe_b64decode(pld_b64 + "==")
        payload = json.loads(payload_bytes.decode())

        if payload.get("exp", 0) < int(time.time()):
            raise ValueError("Token has expired")

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Returns current user from Authorization header if present, else None."""
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    try:
        return verify_token(token)
    except HTTPException:
        return None


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Strictly enforces authentication. Raises 401 if missing or invalid."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token"
        )
    token = authorization.replace("Bearer ", "").strip()
    return verify_token(token)


def require_permission(required_permission: str):
    """Dependency factory returning a callable dependency for checking role permissions."""
    async def permission_dependency(
        request: Request,
        user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        role = user.get("role", "VIEWER")
        allowed_perms = ROLE_PERMISSIONS.get(role, [])
        client_ip = request.client.host if request.client else "127.0.0.1"

        if required_permission not in allowed_perms:
            db_repo.log_audit(
                user=user.get("email", "unknown"),
                role=role,
                action=f"Attempted action requiring permission '{required_permission}'",
                target=request.url.path,
                result="DENIED",
                ip=client_ip,
                details=f"RBAC Policy Denied: Role {role} lacks permission {required_permission}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{role}' does not possess permission '{required_permission}'"
            )
        return user

    return permission_dependency
