"""
AI Engine A: Temporal World Model.
Predicts future network state S_{t+1} from sequence of historical states S_{t-N...t}.
Supports PyTorch / NumPy when available, with pure Python fallback for high portability.
"""

import os
import logging
from typing import List, Optional
from app.models.schemas import NetworkState
from app.core.config import settings

logger = logging.getLogger("CHRONOS-WS.WorldModel")

class TemporalWorldModel:
    def __init__(self):
        self.input_dim = settings.INPUT_DIM
        self.seq_length = settings.SEQUENCE_LENGTH
        self._inference_engine = None
        self._init_engine()

    def _init_engine(self):
        try:
            from ml.inference import TemporalInferenceEngine
            checkpoint_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'checkpoints', 'world_model.pth'))
            if os.path.exists(checkpoint_path):
                self._inference_engine = TemporalInferenceEngine(checkpoint_path=checkpoint_path)
                logger.info(f"Loaded PyTorch LSTM World Model from {checkpoint_path}")
        except Exception as e:
            logger.warning(f"Could not load PyTorch TemporalInferenceEngine: {e}. Using heuristic fallback.")

    def predict_next_state(self, historical_states: List[NetworkState]) -> NetworkState:
        if not historical_states:
            return NetworkState(timestamp="Predicted S_{t+1}")
            
        if self._inference_engine is not None:
            try:
                pred_state, conf, tag = self._inference_engine.predict_next_state(historical_states)
                return pred_state
            except Exception as e:
                logger.warning(f"PyTorch LSTM prediction failed: {e}. Falling back to extrapolation.")

        latest = historical_states[-1]
        risk = latest.security_risk
        
        return NetworkState(
            timestamp="Predicted S_{t+1}",
            time_step=latest.time_step + 1,
            connection_count=float(latest.connection_count * (1.0 + risk * 0.2)),
            bytes_in=float(latest.bytes_in * (1.0 + risk * 0.15)),
            bytes_out=float(latest.bytes_out * (1.0 + risk * 0.15)),
            packets=float(latest.packets * (1.0 + risk * 0.2)),
            unique_sources=float(latest.unique_sources),
            unique_destinations=float(latest.unique_destinations),
            unique_ports=float(latest.unique_ports),
            syn_count=float(latest.syn_count * (1.0 + risk * 0.3)),
            rst_count=float(latest.rst_count),
            request_rate=float(latest.request_rate * (1.0 + risk * 0.25)),
            failed_login_count=float(latest.failed_login_count),
            authentication_failure_rate=min(1.0, float(latest.authentication_failure_rate)),
            database_query_rate=float(latest.database_query_rate * (1.0 + risk * 0.4)),
            suspicious_event_count=float(latest.suspicious_event_count),
            cpu_load=min(100.0, float(latest.cpu_load + risk * 15.0)),
            memory_load=min(100.0, float(latest.memory_load + risk * 10.0)),
            active_connections=float(latest.active_connections),
            security_risk=min(1.0, float(latest.security_risk * 1.1 if risk > 0 else 0.05)),
            asset_risk=min(1.0, float(latest.asset_risk * 1.1 if risk > 0 else 0.05))
        )

world_model = TemporalWorldModel()

