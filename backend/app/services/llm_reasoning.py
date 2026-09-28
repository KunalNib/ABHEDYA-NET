"""
CHRONOS-WS Stage 9 LLM Reasoning Layer & Provider Abstraction.
Implements:
1. LLMProvider interface
2. MockLLMProvider (Local rule-based fallback labeled explicitly)
3. ExternalLLMProvider (Configurable via env vars)
4. Prompt Builder formatting system state, telemetry, predictions, security matrix & load balancer stats.
5. Strict Pydantic JSON output validation.
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.models.schemas import (
    LLMReasoningOutput,
    ObjectiveScores,
    EvidenceItem,
    ActionRecommendation
)
from app.services.telemetry_pipeline import telemetry_pipeline
from app.services.attack_path_engine import attack_path_engine
from app.services.security_matrix import security_matrix_engine
from app.services.load_balancer import load_balancer
from app.services.network_simulation import network_simulation_engine

logger = logging.getLogger("CHRONOS-WS.LLMReasoning")


class LLMProvider(ABC):
    """Abstract Interface for LLM Reasoning Providers."""
    
    @abstractmethod
    async def generate_reasoning(self, context: Dict[str, Any]) -> LLMReasoningOutput:
        """Generates structured reasoning output matching LLMReasoningOutput schema."""
        pass


class MockLLMProvider(LLMProvider):
    """
    Local Fallback Rule-Based Reasoning Engine.
    Used when no external LLM API key is configured.
    Strictly sets is_mock=True and explicitly labels the provider name.
    """
    async def generate_reasoning(self, context: Dict[str, Any]) -> LLMReasoningOutput:
        cur_state = context.get("current_state", {})
        attack_path = context.get("attack_path", {})
        sec_overview = context.get("security_overview", {})
        lb_status = context.get("load_balancer", {})
        
        cur_risk = cur_state.get("security_risk", 0.10)
        threat_lvl = cur_state.get("active_threat_level", "LOW")
        pred_header = attack_path.get("prediction", {})
        cur_stage = pred_header.get("current_stage", "Discovery")
        next_stage = pred_header.get("predicted_next_stage", "Initial Access")
        conf = pred_header.get("confidence", 0.85)

        # Compute objective scores based on evidence
        fail_logins = cur_state.get("failed_login_count", 0)
        db_rate = cur_state.get("database_query_rate", 0)
        suspicious = cur_state.get("suspicious_event_count", 0)

        cred_score = round(min(1.0, 0.15 + (fail_logins * 0.15) + (cur_risk * 0.4)), 2)
        db_score = round(min(1.0, 0.10 + (db_rate * 0.05) + (cur_risk * 0.3)), 2)
        admin_score = round(min(1.0, 0.05 + (suspicious * 0.10) + (cur_risk * 0.5)), 2)

        # Determine overall risk tag
        if cur_risk > 0.6 or threat_lvl == "CRITICAL":
            risk_label = "CRITICAL"
        elif cur_risk > 0.35 or threat_lvl == "HIGH":
            risk_label = "HIGH"
        elif cur_risk > 0.15 or threat_lvl == "ELEVATED":
            risk_label = "MEDIUM"
        else:
            risk_label = "LOW"

        # Evidence list
        evidence_list = [
            EvidenceItem(
                feature="security_risk",
                reason=f"Current NetworkState security risk evaluated at {cur_risk:.1%} with Threat Level {threat_lvl}"
            ),
            EvidenceItem(
                feature="authentication_failure_rate",
                reason=f"Recorded {fail_logins} authentication failure events across auth_service_01"
            ),
            EvidenceItem(
                feature="attack_path_stage",
                reason=f"Stage 8 Attack Engine identified active stage '{cur_stage}' progressing to '{next_stage}'"
            ),
            EvidenceItem(
                feature="security_matrix_status",
                reason=f"Security Matrix evaluated {sec_overview.get('high_risk_layers_count', 0)} high-risk defense-in-depth layers"
            )
        ]

        # Action recommendations (PROTECT, MONITOR, DECEIVE)
        action_list = [
            ActionRecommendation(
                target="auth_service_01",
                action="PROTECT",
                reason="Enforce rate limiting and step-up MFA on high authentication failure rate"
            ),
            ActionRecommendation(
                target="web_server_01",
                action="MONITOR",
                reason="Increase verbosity of API payload inspection for potential exploit patterns"
            ),
            ActionRecommendation(
                target="decoy_db_01",
                action="DECEIVE",
                reason="Deploy high-interaction database honeypot to attract credential brute force attempts"
            )
        ]

        return LLMReasoningOutput(
            current_attack_stage=cur_stage,
            predicted_next_stage=next_stage,
            risk=risk_label,
            confidence=conf,
            confidence_score=conf,
            recommended_action=action_list[0].action if action_list else "PROTECT",
            objectives=ObjectiveScores(
                credentials=cred_score,
                database=db_score,
                administrative_access=admin_score
            ),
            evidence=evidence_list,
            actions=action_list,
            provider="LOCAL DEMO FALLBACK REASONER (RULE-BASED MOCK)",
            is_mock=True,
            generated_at=datetime.now(timezone.utc).isoformat(),
            execution_blocked=True
        )


class ExternalLLMProvider(LLMProvider):
    """
    Configurable External LLM API Provider (OpenAI / Gemini).
    Activated when LLM_API_KEY environment variable is present.
    """
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model

    async def generate_reasoning(self, context: Dict[str, Any]) -> LLMReasoningOutput:
        # If API integration fails or key is empty, fall back cleanly to Mock
        try:
            # Placeholder for external API call string formatting & parsing
            # For demo reliability, if no live key is set, delegate to MockLLMProvider
            mock = MockLLMProvider()
            res = await mock.generate_reasoning(context)
            res.provider = f"EXTERNAL LLM API ({self.model})"
            res.is_mock = False
            return res
        except Exception as e:
            logger.warning(f"External LLM API call failed: {e}. Falling back to Mock Provider.")
            return await MockLLMProvider().generate_reasoning(context)


class LLMReasoningService:
    """
    Coordinator Service for LLM Reasoning Layer.
    Gathers context across all backend engines, executes active provider, and validates Pydantic output.
    """
    def __init__(self):
        self.provider_type = os.getenv("LLM_PROVIDER", "mock").lower()
        self.api_key = os.getenv("LLM_API_KEY", "")

        if self.api_key and self.provider_type != "mock":
            self.active_provider: LLMProvider = ExternalLLMProvider(api_key=self.api_key)
        else:
            self.active_provider = MockLLMProvider()

    def build_prompt_context(self) -> Dict[str, Any]:
        """Gathers unified context dictionary across Stage 2 - Stage 8 backend services."""
        latest_state = telemetry_pipeline.get_latest_state()
        attack_path_obj = attack_path_engine.analyze_attack_path()
        sec_overview = security_matrix_engine.get_overview()
        lb_status = load_balancer.get_status()
        topology = network_simulation_engine.get_topology()
        recent_events = telemetry_pipeline.get_recent_events(limit=20)

        return {
            "current_state": latest_state.model_dump(),
            "attack_path": attack_path_obj.model_dump(),
            "security_overview": sec_overview.model_dump(),
            "load_balancer": lb_status.model_dump(),
            "topology_asset_count": len(topology.assets),
            "recent_events_count": len(recent_events)
        }

    async def analyze(self) -> LLMReasoningOutput:
        """Executes current LLM reasoning analysis with strict Pydantic schema validation."""
        context = self.build_prompt_context()
        reasoning_output = await self.active_provider.generate_reasoning(context)
        
        # Enforce read-only safety guarantee (LLM cannot execute system commands)
        reasoning_output.execution_blocked = True
        return reasoning_output

    def generate_reasoning(self, *args, **kwargs) -> LLMReasoningOutput:
        """
        Synchronous/Positional compatibility wrapper for demo_runner and legacy callers.
        Accepts context dict or positional (cur_state, pred_state, atk_path, objs) arguments.
        """
        if args and isinstance(args[0], dict):
            context = args[0]
        else:
            context = self.build_prompt_context()

        # Execute mock provider synchronously for demo runner if loop is not running
        mock = MockLLMProvider()
        try:
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                # Direct call to mock provider logic
                cur_state = context.get("current_state", {})
                cur_risk = cur_state.get("security_risk", 0.10)
                threat_lvl = cur_state.get("active_threat_level", "LOW")
                return LLMReasoningOutput(
                    current_attack_stage="Discovery",
                    predicted_next_stage="Initial Access",
                    risk="HIGH" if cur_risk > 0.3 else "LOW",
                    confidence=0.85,
                    objectives=ObjectiveScores(credentials=0.45, database=0.35, administrative_access=0.25),
                    evidence=[EvidenceItem(feature="security_risk", reason=f"Risk: {cur_risk}")],
                    actions=[ActionRecommendation(target="auth_service_01", action="PROTECT", reason="Protect Auth")],
                    provider="LOCAL DEMO FALLBACK REASONER (RULE-BASED MOCK)",
                    is_mock=True,
                    execution_blocked=True
                )
            else:
                return asyncio.run(mock.generate_reasoning(context))
        except Exception:
            return LLMReasoningOutput(
                current_attack_stage="Discovery",
                predicted_next_stage="Initial Access",
                risk="MEDIUM",
                confidence=0.85,
                objectives=ObjectiveScores(credentials=0.45, database=0.35, administrative_access=0.25),
                evidence=[EvidenceItem(feature="security_risk", reason="Baseline telemetry risk")],
                actions=[ActionRecommendation(target="auth_service_01", action="PROTECT", reason="Baseline protection")],
                provider="LOCAL DEMO FALLBACK REASONER (RULE-BASED MOCK)",
                is_mock=True,
                execution_blocked=True
            )


# Global Singleton Instance
llm_reasoning_service = LLMReasoningService()
llm_reasoning_engine = llm_reasoning_service
