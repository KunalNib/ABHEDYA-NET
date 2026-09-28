# CHRONOS-WS: Main SIH Presentation & Demonstration Guide

## 1. Executive Summary for Evaluators
**CHRONOS-WS** (*Cyber Deception & Temporal Attack-Path Prediction System for Defence Networks*) is designed to solve a critical limitation of modern Security Operations Centers (SOCs): reactive detection after breach damage has already occurred.

CHRONOS-WS operates an **autonomous, proactive, and predictive defense loop**:
1. **Forecasts Attacks Before Escalation**: Using a trained **PyTorch LSTM World Model** (`checkpoints/world_model.pth`), the system forecasts future network state transitions $S_{t+1}$ up to 60 seconds into the future.
2. **Infers Adversarial Objectives**: Using **Bayesian hypothesis testing**, it identifies whether an attacker aims for credential harvesting, database exfiltration, or administrative takeover.
3. **Validates Autonomous Defense**: Proposes multi-action defensive strategies with mathematical policy constraints ensuring 99.9% uptime for authentic users.
4. **Deploys Dynamic Cyber Deception**: Diverts adversarial probes away from production assets into isolated VLAN 99 honeypots without revealing defensive presence.

---

## 2. Live Demonstration Walkthrough (3-to-5 Minutes)

### Step 1: Establish System Operational Mode
- Open the Dashboard at `http://localhost:5173/dashboard`.
- Point out the **System Mode Switcher** in the top bar:
  - `[LIVE CONTROLLED TEST]` *(Primary Active Mode)*
  - `[DATASET REPLAY]` *(Benchmark Evaluation)*
  - `[JUDGE DEMO]` *(Deterministic Fallback)*
- Direct judges' attention to the live status badges:
  - **Telemetry**: `● LIVE`
  - **Network State**: `● LIVE`
  - **AI**: `● RUNNING`
  - **LLM**: `● CONNECTED / FALLBACK`
  - **Deception**: `ACTIVE / INACTIVE`

### Step 2: Launch Live Controlled Test
- Click **`START LIVE TEST`** (or click **`STEP TESTBED`** to inspect cycle-by-cycle).
- Explain to judges:
  > *"The system is now generating controlled synthetic network traffic through our local test client. Notice that every stage moves through genuine OS processes, telemetry pipelines, and PyTorch forward passes."*

### Step 3: Present the 7 Core Operational Answers
Walk through the **Main Evaluation Matrix** on the dashboard, which explicitly answers the 7 foundational questions:
1. **WHAT IS HAPPENING?**: Shows the active attack phase (Reconnaissance $\rightarrow$ Port Scan $\rightarrow$ Auth Spray $\rightarrow$ Honeytrap Trapping).
2. **WHY?**: Explains the root cause using the 19-dimensional feature aggregator (e.g. sudden spike in failed logins or SYN probes).
3. **WHAT DOES AI PREDICT?**: Highlights the PyTorch LSTM prediction horizon for the upcoming network state and confidence score.
4. **WHAT DOES THE SYSTEM THINK THE OBJECTIVE IS?**: Displays Bayesian probability distributions across attacker goals (e.g., 78% Database Exfiltration).
5. **WHAT ACTION DID IT TAKE?**: Highlights the approved defensive action (e.g., `PROTECT & DECEIVE` with load balancer weight shift).
6. **WHAT WAS THE RESULT?**: Confirms zero downtime and zero data leakage on authentic production assets.
7. **WHAT HAPPENED NEXT?**: Demonstrates the decoy trap capturing the query and reinjecting forensic telemetry back into the pipeline as closed-loop feedback.

### Step 4: Inspect the Visible Live Event Timeline
- Scroll to the **Visible Live Event Timeline**.
- Demonstrate that every single event is logged with:
  - `timestamp`: UTC execution time
  - `source`: Sensor name (Zeek, Suricata, Auth Log, NGINX, Decoy Honeypot)
  - `asset`: Target asset ID (`web_server_01`, `auth_service_01`, `decoy_db_01`)
  - `event_type`: Event taxonomy (`BENIGN_FLOW`, `PORT_SCAN_PROBE`, `AUTH_FAILURE_SPIKE`, `DECOY_HONEYPOT_ACCESS`)
  - `severity`: Rating (`INFO`, `LOW`, `HIGH`, `CRITICAL`)
  - `description`: Plain-language explanation of the event

---

## 3. Anticipated Judge Questions & Proof Points

### Q1: "Is this simulation running on static fake data or real code?"
- **Proof**: 
  - Open a terminal and show the live uvicorn server handling incoming HTTP cycles:
    ```bash
    curl -X POST http://localhost:8000/api/v1/live-testbed/step
    ```
  - Show the SQLite database storing audit logs:
    ```bash
    sqlite3 backend/chronos_ws.db "SELECT id, user, action, target, result FROM audit_logs ORDER BY id DESC LIMIT 5;"
    ```
  - Point to the active WebSocket stream receiving live JSON payloads.

### Q2: "Where is the ML model and is it actually being evaluated?"
- **Proof**:
  - Show the PyTorch checkpoint file: `backend/checkpoints/world_model.pth`.
  - Open [`backend/app/services/world_model.py`](file:///home/kunal/Desktop/SIH/backend/app/services/world_model.py) and show class `LSTMWorldModel(nn.Module)`.
  - Explain that every cycle passes a tensor shape of `(1, 10, 19)` through the model:
    ```python
    x_tensor = torch.tensor(feature_matrix, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        out, _ = self.model(x_tensor)
        predicted_state = out[0, -1, :].numpy()
    ```

### Q3: "How do you ensure deception does not harm production systems?"
- **Proof**:
  - Point to [`backend/app/services/deception_engine.py`](file:///home/kunal/Desktop/SIH/backend/app/services/deception_engine.py).
  - Show strict network isolation: Decoy services exist on **VLAN 99 (`192.168.99.0/24`)** with no routing into the production `10.0.0.0/8` subnet.
  - Resource isolation: Container limits capped at 0.25 vCPU and 256MB RAM.
  - Zero sensitive data: Decoy databases contain only synthetic canary records and dummy flags.

### Q4: "How does the system perform on standardized benchmark datasets?"
- **Proof**:
  - Switch the mode to **`DATASET REPLAY`**.
  - Show the system ingesting pre-processed sequences from **CIC-IDS-2018** and **CTU-13** (`processed_data/cic_ids_2018_states.json`).
  - Demonstrate that the exact same PyTorch LSTM model and attack path engine process benchmark frames.

---

## 4. Reset & Fallback Plan
- To reset live environment at any time: Click **`RESET ENVIRONMENT`** (calls `POST /api/v1/live-testbed/reset`).
- If an evaluator requests the scripted 11-step walkthrough: Switch mode to **`JUDGE DEMO`** and click **`START JUDGE DEMO`**.
