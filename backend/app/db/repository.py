"""
CHRONOS-WS Database Repository & Entity Persistence Service.
Provides centralized database storage methods for:
- Users & Role updates
- Audit logs
- Telemetry events
- Network states
- Model predictions
- Attack paths
- Objective hypotheses
- Defence decisions
- Load balancer decisions
- Deception interaction events
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.db.database import SessionLocal
from app.db.models import (
    UserRecord,
    AuditLogRecord,
    TelemetryLog,
    NetworkStateRecord,
    PredictionRecord,
    AttackPathRecord,
    ObjectiveRecord,
    DefenceDecisionRecord,
    LoadBalancerDecisionRecord,
    DeceptionInteractionRecord
)

logger = logging.getLogger("CHRONOS-WS.Repository")


class DatabaseRepository:
    def __init__(self):
        pass

    def log_audit(
        self,
        user: str,
        role: str,
        action: str,
        target: str,
        result: str = "SUCCESS",
        ip: str = "127.0.0.1",
        details: Optional[str] = None
    ) -> AuditLogRecord:
        """Persists an immutable audit log entry."""
        db = SessionLocal()
        try:
            log_id = f"aud-{int(datetime.now(timezone.utc).timestamp()*1000)}"
            record = AuditLogRecord(
                id=log_id,
                timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                user=user,
                role=role,
                action=action,
                target=target,
                result=result,
                ip=ip,
                details=details
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting audit log: {e}")
            return None
        finally:
            db.close()

    def get_audit_logs(self, limit: int = 50) -> List[AuditLogRecord]:
        """Retrieves latest audit logs."""
        db = SessionLocal()
        try:
            return db.query(AuditLogRecord).order_by(AuditLogRecord.id.desc()).limit(limit).all()
        finally:
            db.close()

    def get_users(self) -> List[UserRecord]:
        """Retrieves all users."""
        db = SessionLocal()
        try:
            return db.query(UserRecord).all()
        finally:
            db.close()

    def get_user_by_email(self, email: str) -> Optional[UserRecord]:
        """Retrieves user by email."""
        db = SessionLocal()
        try:
            return db.query(UserRecord).filter(UserRecord.email == email.strip().lower()).first()
        finally:
            db.close()

    def create_user(self, name: str, email: str, role: str, password_hash: str) -> UserRecord:
        """Creates a new user record."""
        db = SessionLocal()
        try:
            user_id = f"usr-{int(datetime.now(timezone.utc).timestamp()*1000)}"
            user = UserRecord(
                id=user_id,
                name=name,
                email=email.strip().lower(),
                role=role,
                password_hash=password_hash,
                status="ACTIVE",
                last_login=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user {email}: {e}")
            raise e
        finally:
            db.close()

    def update_user_role(self, user_id: str, new_role: str) -> Optional[UserRecord]:
        """Updates user's role."""
        db = SessionLocal()
        try:
            user = db.query(UserRecord).filter(UserRecord.id == user_id).first()
            if user:
                user.role = new_role
                db.commit()
                db.refresh(user)
            return user
        finally:
            db.close()

    def toggle_user_status(self, user_id: str) -> Optional[UserRecord]:
        """Toggles user status between ACTIVE and DISABLED."""
        db = SessionLocal()
        try:
            user = db.query(UserRecord).filter(UserRecord.id == user_id).first()
            if user:
                user.status = "DISABLED" if user.status == "ACTIVE" else "ACTIVE"
                db.commit()
                db.refresh(user)
            return user
        finally:
            db.close()

    def persist_telemetry_event(self, event_data: Dict[str, Any]):
        """Persists a canonical telemetry event."""
        db = SessionLocal()
        try:
            record = TelemetryLog(
                event_id=event_data.get("event_id", f"evt-{datetime.now(timezone.utc).timestamp()}"),
                timestamp=event_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                source=event_data.get("source", "network_flows"),
                event_type=event_data.get("event_type", "FLOW"),
                severity=event_data.get("severity", "INFO"),
                asset_id=event_data.get("asset_id", "edge_firewall_01"),
                features_json=json.dumps(event_data.get("features", {})),
                metadata_json=json.dumps(event_data.get("metadata", {})),
                is_decoy="decoy" in str(event_data.get("asset_id", "")).lower()
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Telemetry persistence notice: {e}")
        finally:
            db.close()

    def persist_network_state(self, state_data: Dict[str, Any]):
        """Persists a canonical NetworkState transition."""
        db = SessionLocal()
        try:
            record = NetworkStateRecord(
                state_id=state_data.get("state_id", "S_unknown"),
                timestamp=state_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                time_step=state_data.get("time_step", 1),
                transition_sequence=state_data.get("transition_sequence", 1),
                active_threat_level=state_data.get("active_threat_level", "LOW"),
                security_risk=float(state_data.get("security_risk", 0.05)),
                asset_risk=float(state_data.get("asset_risk", 0.04)),
                connection_count=float(state_data.get("connection_count", 100.0)),
                cpu_load=float(state_data.get("cpu_load", 25.0)),
                memory_load=float(state_data.get("memory_load", 35.0)),
                authentication_failure_rate=float(state_data.get("authentication_failure_rate", 0.0)),
                metrics_json=json.dumps(state_data)
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Network state persistence notice: {e}")
        finally:
            db.close()

    def persist_prediction(self, prediction_data: Dict[str, Any]):
        """Persists a temporal future state prediction."""
        db = SessionLocal()
        try:
            record = PredictionRecord(
                timestamp=datetime.now(timezone.utc).isoformat(),
                model_version=prediction_data.get("model_version", "v1.0.0"),
                confidence=float(prediction_data.get("confidence", 0.85)),
                predicted_state_id=prediction_data.get("predicted_state_id", "S_pred"),
                predicted_threat_level=prediction_data.get("predicted_threat_level", "LOW"),
                predicted_risk=float(prediction_data.get("predicted_risk", 0.05)),
                predicted_state_json=json.dumps(prediction_data)
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Prediction persistence notice: {e}")
        finally:
            db.close()

    def persist_attack_path(self, path_data: Dict[str, Any]):
        """Persists an attack path analysis graph and prediction."""
        db = SessionLocal()
        try:
            pred = path_data.get("prediction", {})
            record = AttackPathRecord(
                path_id=path_data.get("path_id", f"PATH-{datetime.now(timezone.utc).timestamp()}"),
                timestamp=datetime.now(timezone.utc).isoformat(),
                current_stage=pred.get("current_stage", "Discovery"),
                predicted_next_stage=pred.get("predicted_next_stage", "Initial Access"),
                confidence=float(pred.get("confidence", 0.85)),
                risk=pred.get("risk", "LOW"),
                graph_json=json.dumps(path_data)
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Attack path persistence notice: {e}")
        finally:
            db.close()

    def persist_objective(self, obj_data: Dict[str, Any]):
        """Persists attacker objective hypotheses."""
        db = SessionLocal()
        try:
            record = ObjectiveRecord(
                timestamp=obj_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                primary_objective=obj_data.get("primary_objective", "administrative_access"),
                prob_credentials=float(obj_data.get("prob_credentials", 0.33)),
                prob_database=float(obj_data.get("prob_database", 0.33)),
                prob_admin=float(obj_data.get("prob_admin", 0.34)),
                explanation=obj_data.get("explanation", "")
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Objective persistence notice: {e}")
        finally:
            db.close()

    def persist_defence_decision(self, decision_data: Dict[str, Any]):
        """Persists a validated adaptive defence decision."""
        db = SessionLocal()
        try:
            record = DefenceDecisionRecord(
                decision_id=decision_data.get("decision_id", f"DEC-{datetime.now(timezone.utc).timestamp()}"),
                timestamp=decision_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                overall_risk=decision_data.get("overall_risk", "LOW"),
                confidence=float(decision_data.get("confidence", 0.85)),
                policy_approved=bool(decision_data.get("policy_approved", True)),
                actions_json=json.dumps(decision_data.get("actions", [])),
                policies_json=json.dumps(decision_data.get("policies", []))
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Defence decision persistence notice: {e}")
        finally:
            db.close()

    def persist_load_balancer_decision(self, lb_data: Dict[str, Any]):
        """Persists a load balancer routing decision."""
        db = SessionLocal()
        try:
            record = LoadBalancerDecisionRecord(
                decision_id=lb_data.get("decision_id", f"LB-{datetime.now(timezone.utc).timestamp()}"),
                timestamp=lb_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                primary_route=lb_data.get("primary_route", "Server A"),
                traffic_allocations_json=json.dumps(lb_data.get("traffic_allocations", {})),
                routing_reasons_json=json.dumps(lb_data.get("routing_reasons", {})),
                risk_penalty_applied=bool(lb_data.get("risk_penalty_applied", False))
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Load balancer decision persistence notice: {e}")
        finally:
            db.close()

    def persist_deception_interaction(self, event_data: Dict[str, Any]):
        """Persists an attacker interaction with a deception zone decoy."""
        db = SessionLocal()
        try:
            record = DeceptionInteractionRecord(
                event_id=event_data.get("event_id", f"dec-evt-{datetime.now(timezone.utc).timestamp()}"),
                timestamp=event_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                source_ip=event_data.get("source_ip", "192.168.99.150"),
                target_decoy=event_data.get("target_decoy", "Adaptive Decoy Database"),
                decoy_port=int(event_data.get("decoy_port", 5433)),
                protocol=event_data.get("protocol", "PostgreSQL"),
                payload_summary=event_data.get("payload_summary", "SELECT * FROM synthetic_data"),
                severity=event_data.get("severity", "HIGH")
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.debug(f"Deception interaction persistence notice: {e}")
        finally:
            db.close()


db_repo = DatabaseRepository()
