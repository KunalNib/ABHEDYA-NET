# CHRONOS-WS: End-to-End System Connectivity Matrix

| Component | Source | Destination | Protocol / Mechanism | Status | Test Result / Verification |
|---|---|---|---|---|---|
| **Simulation Engine** | `NetworkSimulationEngine` | `TelemetryPipeline` | Internal Python Call | PASS | Tested in `test_stage2_simulation.py`; generates valid `NetworkEvent` objects. |
| **Telemetry Ingestion** | External Sensors / Simulation | Backend `/telemetry/events` | HTTP POST / REST | PASS | Tested in `test_stage5_telemetry_pipeline.py`; returns 201 with UUID. |
| **Network State Synthesis** | `TelemetryPipeline` | `NetworkState` Repository | Internal Windowing & SQLite | PASS | 19 canonical features aggregated; state persisted to `network_state_logs`. |
| **Historical States Sequence** | SQLite Database | `TemporalInferenceEngine` | Python List slicing (T=10) | PASS | Tested sequence window retrieval up to limit. |
| **ML Next-State Prediction** | `TemporalInferenceEngine` (PyTorch) | `world_model.pth` | PyTorch Forward Pass | PASS | Tested in `test_stage7_world_model.py`; tensor shape `(1, 10, 19)` -> `(1, 19)`. |
| **Prediction to Backend State** | `world_model` | `closed_loop_orchestrator` | Internal Python Service | PASS | Tested in `test_stage14_closed_loop.py`; generates valid $S_{t+1}$ object. |
| **Prediction to Frontend** | Backend `/attack-path/prediction` | Frontend `AIPredictionsPage` | HTTP GET / REST | PASS | Verified endpoint returns schema-compliant prediction payload. |
| **Attack Path Derivation** | `AttackPathPredictionEngine` | MITRE ATT&CK Graph | Internal Rule & ML Engine | PASS | Tested in `test_stage8_attack_path.py`; maps risk to MITRE nodes & edges. |
| **Objective Inference** | Bayesian Belief Update | Objective Hypotheses | Mathematical Model | PASS | Tested in `test_stage10_objectives.py`; probabilities sum to ~1.0. |
| **LLM Reasoning Layer** | Aggregated Telemetry & State | Structured Recommendation | OpenAI / Groq / Fallback | PASS | Tested in `test_stage9_llm_reasoning.py`; Pydantic schema validation. |
| **Policy Validation** | AI Recommendation | Authorized Defence Action | Deterministic Policy Filter | PASS | Ensures AI recommendations never bypass security constraints. |
| **Defence Decision** | `AdaptiveDefenceEngine` | Backend `/defence/decision` | HTTP GET & Internal API | PASS | Tested in `test_stage12_adaptive_defence.py`; returns active countermeasures. |
| **Load Balancer Adaptation** | Backend `/load-balancer/status` | Frontend `NetworkPage` | HTTP GET & WebSocket | PASS | Tested in `test_stage4_load_balancer.py`; dynamic traffic shedding verified. |
| **Deception Activation** | `AdaptiveDefenceEngine` | `DeceptionEngine` (Decoys) | Internal API Call | PASS | Tested in `test_stage13_deception.py`; spins up high-interaction honeypots. |
| **Decoy Interaction** | Threat Actor / Simulation | Decoy Services | HTTP / SSH / Port Trap | PASS | Honeypot triggers interaction telemetry log. |
| **Deception Feedback Loop** | `DeceptionEngine` | `TelemetryPipeline` | Event Ingestion Loop | PASS | Decoy interaction reinjected as high-fidelity telemetry event. |
| **Realtime Telemetry Broadcast** | `WebSocketManager` | Frontend `RealtimeContext` | WebSocket (`/ws`) | PASS | Broadcasts `telemetry_update`, `network_state_update`, `prediction_update`. |
| **Realtime Defence Broadcast** | `WebSocketManager` | Frontend `RealtimeContext` | WebSocket (`/ws`) | PASS | Broadcasts `defence_update`, `load_balancer_update`, `deception_update`. |
| **Authentication & Session** | Frontend `authService` | Backend `/auth/login` | HTTP POST (HMAC Token) | PASS | Tested in `test_audit_rbac_and_persistence.py`; returns valid JWT session. |
| **Role-Based Authorization** | Backend `require_permission` | API Endpoints | FastAPI Dependency | PASS | Tested 4 roles (`ADMIN`, `SOC_ANALYST`, `SECURITY_ENGINEER`, `VIEWER`). |
| **Audit Persistence** | Backend Actions | SQLite `audit_logs` | SQLAlchemy ORM | PASS | Tested in `test_audit_rbac_and_persistence.py`; tracks all sensitive events. |
| **Judge Demo Mode** | Backend `/judge-demo/*` | Frontend Controller | REST & WebSocket | PASS | Tested deterministic 11-step execution and clean reset. |
