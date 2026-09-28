# CHRONOS-WS: Frontend ↔ Backend Connectivity Mapping

**Project**: AI-Driven Adaptive Cyber Deception & Attack-Path Prediction Platform for Defence Networks  
**Audit Phase**: Connectivity & Protocol Contract Verification  
**Date**: September 2026  
**Status**: VERIFIED & TESTED  

---

## Complete Connectivity Mapping Matrix

| UI Component | Frontend Service / Hook | HTTP / WS Endpoint | Backend Route Handler | Underlying Backend Service | Database / Authoritative Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LoginPage** | `authService.login()` | `POST /api/v1/auth/login` | `login()` in `endpoints.py` | `db_repo.get_user_by_email()` | SQLite `users` table |
| **AppShell / Profile** | `authService.getCurrentSession()` | `GET /api/v1/auth/me` | `get_current_user_profile()` | `get_current_user` dependency | SQLite `users` table |
| **AdminUsersPage** | `userService.getUsers()` | `GET /api/v1/users` | `list_users()` | `db_repo.get_users()` | SQLite `users` table (ADMIN only) |
| **AdminUsersPage (Create)**| `userService.createUser()` | `POST /api/v1/users` | `create_user_record()` | `db_repo.create_user()` | SQLite `users` & `audit_logs` |
| **AdminUsersPage (Role)** | `userService.updateUserRole()`| `PATCH /api/v1/users/{id}/role` | `update_user_role_record()` | `db_repo.update_user_role()` | SQLite `users` & `audit_logs` |
| **AdminAuditPage** | `fetchAuditLogs()` | `GET /api/v1/audit/logs` | `get_audit_trail()` | `db_repo.get_audit_logs()` | SQLite `audit_logs` table (ADMIN only) |
| **Dashboard (Status)** | `RealtimeContext` | `GET /api/v1/system/status` | `system_status()` in `main.py` | `check_database_connection()` | System health & engine checks |
| **Dashboard (WebSocket)**| `createClosedLoopWebSocket()` | `WS /api/v1/ws` | `websocket_endpoint()` | `ws_manager.broadcast()` | Live broadcast across 10 event types |
| **NetworkPage (Topology)**| `network_simulation_engine` | `GET /api/v1/network/topology` | `get_network_topology()` | `network_simulation_engine` | In-memory 6-asset state & DB |
| **NetworkPage (Security)**| `fetchSecurityOverview()` | `GET /api/v1/security/overview` | `get_security_overview()` | `security_matrix_engine` | 9 Defense-in-Depth layers & controls |
| **NetworkPage (Load Balancer)**| `fetchLoadBalancerStatus()` | `GET /api/v1/load-balancer/status` | `get_load_balancer_status()` | `load_balancer.get_status()` | Server pool metrics & dynamic scores |
| **NetworkPage (LB Rerouting)**| `updateServerRisk()` | `POST /api/v1/load-balancer/update-risk` | `update_server_risk()` | `load_balancer.update_server_risk()` | Recalculated traffic weights & audit log |
| **AIPredictionsPage (LSTM)**| `RealtimeContext` / API | `GET /api/v1/network/states/latest` | `get_latest_network_state()` | `ml.inference.TemporalInferenceEngine` | Checkpoint `world_model.pth` & DB |
| **AIPredictionsPage (Objs)**| `fetchObjectivesCurrent()` | `GET /api/v1/objectives/current` | `get_current_objectives()` | `objective_engine.infer_objectives()` | Bayesian Dirichlet distribution |
| **AttackPathPage** | `fetchAttackPathCurrent()` | `GET /api/v1/attack-path/current` | `get_attack_path_current()` | `attack_path_engine.analyze_attack_path()` | MITRE ATT&CK tactical graph & DB |
| **AttackPathPage (Pred)**| `fetchAttackPathPrediction()` | `GET /api/v1/attack-path/prediction` | `get_attack_path_prediction()` | `attack_path_engine` | State sequence & future horizon |
| **DefencePage (Actions)** | `fetchCurrentDefence()` | `GET /api/v1/defence/current` | `get_current_defence()` | `adaptive_defence_engine` | Policy-validated actions (POL-001..4) |
| **DeceptionPage (Status)**| `fetchDeceptionStatus()` | `GET /api/v1/deception/status` | `get_deception_status()` | `deception_engine.get_deception_status()`| Isolated VLAN 99 Decoy services |
| **DeceptionPage (Activate)**| `activateDeception()` | `POST /api/v1/deception/activate` | `activate_deception_environment()` | `deception_engine.activate_deception()` | Decoys 5433, 8081, 8082 & audit log |
| **TelemetryPage (Recent)**| `fetchRecentTelemetry()` | `GET /api/v1/telemetry/recent` | `get_recent_telemetry()` | `telemetry_pipeline.get_recent_events()`| 7 canonical telemetry sources & DB |
| **TelemetryPage (States)**| `fetchNetworkStates()` | `GET /api/v1/network/states` | `get_network_states()` | `telemetry_pipeline.get_state_history()` | Time-windowed canonical $S_t$ history |
| **ReportsPage** | `reportsService.getMeasuredReport()` | `GET /api/v1/telemetry/stats` etc. | Multi-endpoint aggregated | `reportsService` | Real telemetry, risk & objectives |
| **Judge Demo (Trigger)** | `triggerDeterministicDemo()`| `POST /api/v1/judge-demo/trigger` | `trigger_deterministic_judge_demo()` | `demo_runner.trigger_demo(seed=42)` | Deterministic 11-phase scenario |
| **Judge Demo (Step)** | `RealtimeContext` step | `POST /api/v1/judge-demo/step` | `step_deterministic_judge_demo()` | `demo_runner.step_forward()` | Synchronous pipeline step & WS broadcast |
| **Judge Demo (Reset)** | `resetJudgeDemo()` | `POST /api/v1/judge-demo/reset` | `reset_deterministic_judge_demo()` | `demo_runner.reset_demo()` | Clean baseline state restoration |
| **Closed-Loop (Continuous)**| `startClosedLoop()` | `POST /api/v1/closed-loop/start` | `start_closed_loop()` | `closed_loop_orchestrator.start_loop()` | Continuous 10-stage feedback loop |
