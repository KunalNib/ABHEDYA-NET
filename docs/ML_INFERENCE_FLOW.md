# CHRONOS-WS: Temporal World Model ML Inference Flow & Backend Contract

## 1. Subsystem Architecture Overview

The Temporal World Model acts as the forward-simulating temporal predictor for CHRONOS-WS. Rather than using an LLM as a temporal engine, CHRONOS-WS uses a specialized, lightweight Recurrent Neural Network (PyTorch LSTM) operating over sequence windows of discrete canonical network telemetry states.

```
+-------------------------------------------------------------------------+
|                  Temporal World Model Inference Flow                    |
+-------------------------------------------------------------------------+
    Historical Network States [S_{t-N} ... S_t] (Storage / Buffer)
                            |
                            v
            Feature Extraction & Schema Validation
                (19 Canonical Feature Fields)
                            |
                            v
               Min-Max Normalization Scaler
                (Loaded from Checkpoint Metadata)
                            |
                            v
               Sequence Window Construction
                 Shape: (1, seq_length=10, 19)
                            |
                            v
      Lightweight Temporal LSTM (PyTorch Forward Pass)
         Input: (Batch, Seq_Len=10, Feat_Dim=19)
         Hidden Dim: 64, Layers: 2, Dropout: 0.2
                            |
         +------------------+------------------+
         |                                     |
         v                                     v
   Predicted Feature Vector           Prediction Confidence
       Shape: (1, 19)                     Shape: (1, 1)
         |                                     |
         v                                     |
  Inverse Min-Max Transformation               |
         |                                     |
         v                                     v
   Synthesized S_{t+1} NetworkState Object + Confidence Score
                            |
                            v
    Downstream Consumers:
    - Attack Path Engine (MITRE ATT&CK next-stage likelihood)
    - Objective Inference Engine (Credential / DB / Admin probabilities)
    - Security-Aware Load Balancer (Server A/B/C routing allocation)
    - Policy-Validated Adaptive Defence (Protect / Monitor / Deceive)
    - Real-Time WebSocket Broadcast (`prediction_update`)
```

---

## 2. Canonical Feature Contract (19 Dimensions)

The ML input and output vectors are strictly bound to the 19 canonical features defined in `ml/features.py` and `NetworkState.feature_names()`:

| Index | Feature Name | Description | Range / Unit | Normalization Bound |
|---|---|---|---|---|
| 0 | `connection_count` | Total active/concurrent flows | Count | [0, 5000] |
| 1 | `bytes_in` | Ingress payload volume | Bytes | [0, 50,000,000] |
| 2 | `bytes_out` | Egress payload volume | Bytes | [0, 100,000,000] |
| 3 | `packets` | Total packet count in window | Count | [0, 200,000] |
| 4 | `unique_sources` | Distinct source IP addresses | Count | [0, 500] |
| 5 | `unique_destinations` | Distinct destination IPs | Count | [0, 100] |
| 6 | `unique_ports` | Distinct targeted ports | Count | [0, 1000] |
| 7 | `syn_count` | TCP SYN flag count | Count | [0, 5000] |
| 8 | `rst_count` | TCP RST flag count | Count | [0, 2000] |
| 9 | `request_rate` | Application HTTP/RPC requests/sec | req/s | [0, 500] |
| 10 | `failed_login_count` | Failed authentication attempts | Count | [0, 100] |
| 11 | `authentication_failure_rate` | Failed logins / total logins | Ratio | [0.0, 1.0] |
| 12 | `database_query_rate` | SQL queries executed/sec | q/s | [0, 200] |
| 13 | `suspicious_event_count` | IDS/WAF anomaly events | Count | [0, 50] |
| 14 | `cpu_load` | Aggregate server CPU utilization | % | [0.0, 100.0] |
| 15 | `memory_load` | Aggregate server RAM utilization | % | [0.0, 100.0] |
| 16 | `active_connections` | Live established sockets | Count | [0, 2500] |
| 17 | `security_risk` | Composite threat risk score | Index | [0.0, 1.0] |
| 18 | `asset_risk` | Mission asset vulnerability index | Index | [0.0, 1.0] |

---

## 3. Preprocessing, Windowing & Scaling

### 3.1 Sequence Construction
- **Sequence Length ($T$)**: 10 discrete time steps.
- **Padding**: When fewer than 10 historical states exist in the telemetry buffer, the earliest known state is prepended to maintain a strict tensor shape of `(1, 10, 19)`.
- **Sliding Window**: Each new telemetry ingestion advances the window by 1 step.

### 3.2 Min-Max Normalization
Each feature $x_i$ is mapped into $[0.0, 1.0]$ using:
$$x_{\text{norm}, i} = \text{clip}\left(\frac{x_i - \min_i}{\max_i - \min_i}, 0.0, 1.0\right)$$

The min/max bounds are serialized directly within the model checkpoint (`scaler` dictionary key in `world_model.pth`), guaranteeing complete symmetry between training and inference without reliance on external environment files.

---

## 4. PyTorch Model Architecture

The `LightweightTemporalLSTM` model in `ml/world_model.py` is configured as follows:
- **Input Dimension**: 19
- **Hidden Dimension**: 64
- **LSTM Layers**: 2
- **Dropout**: 0.2
- **Bidirectional**: False
- **Output Heads**:
  1. **Next-State Head (`fc_state`)**: Linear(64, 19) -> Sigmoid activation (predicts normalized feature values for $S_{t+1}$)
  2. **Confidence Head (`fc_conf`)**: Linear(64, 1) -> Sigmoid activation (predicts model confidence score $\in [0.0, 1.0]$)

---

## 5. Model Loading, Versioning & Fallback Hierarchy

The system operates a multi-tiered fallback architecture to ensure 100% operational availability:

1. **Primary**: `checkpoints/world_model.pth` loaded via `TemporalInferenceEngine`.
   - Identified by tag: `v1.0.0 [SYNTHETIC DEMO MODEL]` or `v1.0.0 [DATASET-TRAINED MODEL]`.
   - Verified local PyTorch forward pass execution.
2. **Secondary Fallback**: Extrapolation engine in `TemporalWorldModel`.
   - Dynamically scales network metrics using current security risk coefficients if PyTorch is missing or checkpoint is unreadable.
   - Emits explicit logging warnings indicating fallback mode.

---

## 6. Downstream Consumer Integration

| Consumer | Consumed Fields | Usage & Effect |
|---|---|---|
| **Attack Path Engine** | `security_risk`, `suspicious_event_count`, `failed_login_count`, `syn_count` | Determines transition probability to next MITRE stage (e.g. Discovery -> Credential Access). |
| **Objective Inference** | `failed_login_count`, `database_query_rate`, `suspicious_event_count` | Updates Bayesian prior probabilities for Credential Access, DB Exfiltration, Administrative Access. |
| **Load Balancer** | `security_risk`, `predicted_risk` | Computes effective risk `max(security_risk, 0.7 * predicted_risk)` and dynamically sheds load away from compromised servers. |
| **Adaptive Defence** | `security_risk`, `asset_risk` | Triggers Policy Validation layer to deploy DECEIVE/MONITOR/PROTECT countermeasures. |
| **WebSocket Clients** | Full `NetworkState` dictionary | Renders dynamic radar charts, state metric graphs, and future prediction banners in UI. |
