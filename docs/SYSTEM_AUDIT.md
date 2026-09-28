# CHRONOS-WS: Comprehensive System Audit & Architectural Baseline

**Project**: AI-Driven Adaptive Cyber Deception & Attack-Path Prediction Platform for Defence Networks  
**Audit Date**: September 2026  
**Auditor**: Senior Full-Stack, ML, DevOps & Security Auditor  
**Repository Branch**: `main`  
**Status**: IN PROGRESS — ARCHITECTURAL AUDIT & VERIFICATION PHASE  

---

## 1. Executive Summary & Freeze Declaration

In compliance with Stage 1 requirements:
- **Feature Freeze Enacted**: No random new features will be introduced. Architecture is preserved and stabilized.
- **Verification Focus**: Trace end-to-end connectivity between Telemetry Ingestion, LSTM World Model Forecasting, Attack-Path Progression, LLM Reasoning, Policy Validation, Adaptive Defence, Security-Aware Load Balancing, and Deception Zone Honeypots.
- **Strict Verification Rules**: Zero browser automation. All verification executed via Python test suites, curl/REST clients, WebSocket streams, and build/typecheck compilation.

---

## 2. Current Architecture & Service Map

The platform is structured into three planes:
1. **Data & Telemetry Plane**: Continuous telemetry generation and ingestion across 7 canonical sources (flows, auth, api, host, database, ids/ips, load balancer). Normalized into time-windowed `NetworkState` feature vectors ($S_t$).
2. **Intelligence Plane**: 
   - **Stage 7 LSTM Temporal World Model**: Predicts $S_{t+1}$ using a 2-layer LSTM trained on CTU-13 / CIC-IDS benchmarks with a 19-dimensional canonical feature vector.
   - **Stage 8 Attack-Path Engine**: Maps predicted state transitions to MITRE ATT&CK tactics (Reconnaissance $\to$ Initial Access $\to$ Credential Access $\to$ Lateral Movement $\to$ Exfiltration).
   - **Stage 10 Multi-Hypothesis Objective Inference**: Evaluates non-collapsing Bayesian probability distributions across attacker goals (`credentials`, `database`, `administrative_access`).
   - **Stage 9 LLM Reasoning Advisory Layer**: Structured JSON recommendation generator with strict Pydantic validation and command execution blocking (`execution_blocked=True`).
3. **Control & Defence Plane**:
   - **Stage 12 Adaptive Defence & Policy Validator**: Multi-action guardrail enforcement (`PROTECT`, `MONITOR`, `DECEIVE`) ensuring core assets remain strictly protected (`POL-001` through `POL-004`).
   - **Stage 4 Security-Aware Load Balancer**: Dynamic rerouting applying exponential risk penalties to compromised server nodes.
   - **Stage 13 Secure Adaptive Deception Engine**: Isolated VLAN 99 honeypots (Adaptive Decoy DB on port 5433, Decoy API on 8081, Decoy Admin on 8082).
   - **Stage 14 Closed-Loop Adaptation Orchestrator**: Real-time feedback loop connecting decoy interactions back to the telemetry pipeline.

---

## 3. Entry Points & Component Inventory

### Backend
- **Entry Point**: `backend/app/main.py` (FastAPI lifespan, CORS, Global Exception Handler)
- **Configuration**: `backend/app/core/config.py` (Environment variables, temporal model dims, decoy ports)
- **Database**: `backend/app/db/database.py` (SQLAlchemy SQLite / PostgreSQL engine, sessionmaker)
- **Models**: `backend/app/db/models.py` (ORM models for telemetry, status logs)
- **API Router**: `backend/app/api/endpoints.py` (REST endpoints, WebSocket `/ws` and `/ws/telemetry`)
- **Services**:
  - `telemetry_generator.py` & `telemetry_pipeline.py` (Event creation, normalization, state windowing)
  - `network_simulation.py` (6-node topology, tick simulation loop)
  - `world_model.py` & `ml/inference.py` (Lightweight PyTorch LSTM inference)
  - `attack_path_engine.py` & `attack_predictor.py` (Graph nodes, edges, MITRE mapping)
  - `objective_inference.py` (Bayesian attacker goal hypotheses)
  - `llm_reasoning.py` (LLM advisory provider abstraction with local mock fallback)
  - `policy_validator.py` (Security boundaries & safety guardrails)
  - `adaptive_defence.py` (Action decision coordinator)
  - `load_balancer.py` (Dynamic server capacity & risk routing)
  - `deception_engine.py` (Decoy honeypot activation, containment, interaction logging)
  - `websocket_manager.py` (Central broadcast manager for 10 event types)
  - `closed_loop_orchestrator.py` (10-stage end-to-end continuous loop)
  - `demo_runner.py` (Deterministic Stage 16 Judge Demo with 11 reproducible phases, seed 42)

### Frontend
- **Entry Point**: `frontend/src/main.tsx` & `frontend/src/App.tsx`
- **Layout**: `components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `GlobalStatusBar.tsx`
- **Contexts**: `AuthContext.tsx`, `PermissionContext.tsx`, `RealtimeContext.tsx`
- **Active Pages**:
  - `/dashboard` $\to$ `components/pages/DashboardPage.tsx`
  - `/network` $\to$ `components/pages/NetworkPage.tsx` (Topology, Security Matrix, Load Balancer tabs)
  - `/ai` $\to$ `components/pages/AIPredictionsPage.tsx` (World Model Forecast, Objective Hypotheses)
  - `/attack-path` $\to$ `components/pages/AttackPathPage.tsx` (Interactive MITRE ATT&CK Graph)
  - `/defence` $\to$ `components/pages/DefencePage.tsx` (Policy-Validated Actions)
  - `/deception` $\to$ `components/pages/DeceptionPage.tsx` (Decoy Honeypots, Containment Metrics)
  - `/telemetry` $\to$ `components/pages/TelemetryPage.tsx` (Live Event Stream & State Transitions)
  - `/reports` $\to$ `components/pages/ReportsPage.tsx` (Telemetry & Security Audit Export)
  - `/admin/users` $\to$ `components/pages/AdminUsersPage.tsx` (Role & Operator Management)
  - `/admin/audit` $\to$ `components/pages/AdminAuditPage.tsx` (Read-only Immutable Audit Trail)
  - `/settings` $\to$ `components/pages/SettingsPage.tsx`
  - `/login`, `/forgot-password`, `/unauthorized`

---

## 4. Current Deficiencies & Audit Findings

1. **Database Disconnect**:
   - `app/db/models.py` was never imported before `Base.metadata.create_all()`, resulting in 0 tables created.
   - Core entities (`users`, `audit_logs`, `network_states`, `predictions`, `defence_decisions`, `deception_events`) existed only in transient memory without persistent DB records.
2. **Authentication & RBAC Enforcement**:
   - Frontend possessed role definitions (`ADMIN`, `SOC_ANALYST`, `SECURITY_ENGINEER`, `VIEWER`), but backend had zero auth middleware, token verification, or endpoint permission checks. Restricted operations (e.g. activating deception, altering load balancer risk) were unauthenticated on the backend.
3. **Schema & Contract Mismatches**:
   - `reportsService.ts` queried `objectives.probabilities` (non-existent field) falling back to hardcoded `0.78`.
   - `NetworkPage.tsx` Load Balancer tab hardcoded 45%/10%/45% instead of consuming real backend load balancer state.
   - `AdminAuditPage.tsx` rendered static sample logs instead of querying backend audit log storage.
4. **WebSocket Logger Bug**:
   - `backend/app/api/endpoints.py` referenced `logger.info` and `logger.warning` without importing or defining `logger`, risking `NameError` on client traffic.
5. **Redundant & Legacy Components**:
   - 9 orphaned page components in `frontend/src/components/` root were unreferenced duplicates of pages in `components/pages/`.
   - 5 legacy page components in `frontend/src/components/pages/` were replaced by tabbed consolidations in `NetworkPage` and `AIPredictionsPage`.
6. **Docker Configuration**:
   - No Dockerfile or docker-compose.yml present in root for local container deployment.

---

## 5. Audit & Remediation Plan

1. **Implement Unified DB Persistence & Models**:
   - Expand `models.py` to persist `User`, `AuditLog`, `NetworkStateRecord`, `TelemetryEventRecord`, `PredictionRecord`, `DefenceDecisionRecord`, `DeceptionInteractionRecord`.
   - Ensure tables are created cleanly on startup with default seeded accounts and audit logs.
2. **Implement Real Backend Authentication & RBAC**:
   - Add `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/users`, and `/api/v1/audit/logs`.
   - Add token validation and role-based permission dependencies (`ADMIN`, `SOC_ANALYST`, `SECURITY_ENGINEER`, `VIEWER`).
   - Protect sensitive mutation routes (deception, load balancer, simulation, admin).
3. **Fix Backend Code Issues**:
   - Define `logger` in `endpoints.py`.
   - Replace deprecated Pydantic `.dict()` calls with `.model_dump()`.
   - Fix asyncio event loop deprecation warning in `llm_reasoning.py`.
4. **Connect Frontend to Real Backend State**:
   - Wire `NetworkPage` Load Balancer tab to live metrics.
   - Fix `reportsService.ts` schema mapping.
   - Wire `AdminUsersPage` and `AdminAuditPage` to backend REST APIs.
   - Wire `RealtimeContext` to backend demo runner endpoints and WebSocket stream.
5. **Remove Verified Redundant Files**:
   - Document each removed file in `docs/REMOVAL_LOG.md`.
6. **Create Docker Deployment**:
   - Add backend & frontend Dockerfiles and `docker-compose.yml`.
7. **Execute End-to-End Verification**:
   - Run unit, integration, and closed-loop deterministic tests.
