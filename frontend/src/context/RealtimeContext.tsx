import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  createClosedLoopWebSocket,
  WSEventMessage,
  API_BASE_URL,
  stepClosedLoop,
  startClosedLoop,
  stopClosedLoop,
  fetchAttackPathPrediction,
  fetchObjectivesCurrent,
  setSystemModeApi,
  getSystemModeStatusApi,
  stepLiveTestbedApi,
  resetLiveTestbedApi,
  fetchLiveTimelineApi,
  stepDatasetReplayApi,
  LiveTimelineEvent,
  SystemModeStatus
} from '../services/api';

import { DEMO_STAGES, JudgeDemoStep } from '../services/demoDataProvider';
import { useAuth } from './AuthContext';

export type SystemExecutionMode = 'LIVE_CONTROLLED_TEST' | 'DATASET_REPLAY' | 'JUDGE_DEMO';

export interface LivePredictionState {
  currentStage: string;
  predictedStage: string;
  confidence: number;
  risk: string;
  affectedAssets: string[];
  modelVersion: string;
  nextState?: Record<string, number>;
}

export interface LiveObjectiveState {
  credentials: number;
  database: number;
  admin: number;
  primary: string;
  explanation: string;
}

export interface SensorStatusBadges {
  telemetry: 'LIVE' | 'OFFLINE';
  network_state: 'LIVE' | 'OFFLINE';
  ai: 'RUNNING' | 'STANDBY';
  llm: 'CONNECTED' | 'FALLBACK';
  deception: 'ACTIVE' | 'INACTIVE';
}

interface RealtimeContextType {
  wsConnected: boolean;
  activeStage: string;
  systemMode: SystemExecutionMode;
  switchSystemMode: (mode: SystemExecutionMode) => Promise<void>;
  sensorBadges: SensorStatusBadges;
  timelineEvents: LiveTimelineEvent[];
  refreshTimeline: () => Promise<void>;
  
  // Live Testbed Controls
  startLiveTest: () => Promise<void>;
  stopLiveTest: () => Promise<void>;
  stepLiveTest: () => Promise<void>;
  resetLiveEnvironment: () => Promise<void>;
  isLiveTestRunning: boolean;
  liveCycleData: any | null;

  // Dataset Replay Controls
  stepDatasetReplay: () => Promise<void>;
  datasetFrame: number;

  // Judge Demo Fallback Controls
  judgeDemoActive: boolean;
  judgeDemoStep: number;
  currentDemoStepData: JudgeDemoStep;
  startJudgeDemo: () => void;
  stopJudgeDemo: () => void;
  resetJudgeDemo: () => void;
  triggerDeterministicDemo: (seed?: number) => void;
  setJudgeDemoStepIndex: (idx: number) => void;

  // Speed / Cadence (Pace) for Live Demo
  demoPaceSeconds: number;
  setDemoPaceSeconds: (sec: number) => void;

  // Live ML & Backend State
  isLiveMode: boolean;
  setIsLiveMode: (live: boolean) => void;
  recentWsEvents: WSEventMessage[];
  livePrediction: LivePredictionState | null;
  liveObjectives: LiveObjectiveState | null;
  liveNetworkState: Record<string, any> | null;
  liveRisk: Record<string, any> | null;
  isLiveLoopRunning: boolean;
  triggerLiveStep: () => Promise<void>;
  startLiveLoop: () => Promise<void>;
  stopLiveLoop: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { environment, setEnvironment } = useAuth();
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<string>('telemetry_update');
  const [systemMode, setSystemMode] = useState<SystemExecutionMode>('LIVE_CONTROLLED_TEST');
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [judgeDemoActive, setJudgeDemoActive] = useState<boolean>(false);
  const [judgeDemoStep, setJudgeDemoStep] = useState<number>(1);
  const [recentWsEvents, setRecentWsEvents] = useState<WSEventMessage[]>([]);
  const [isLiveTestRunning, setIsLiveTestRunning] = useState<boolean>(false);
  const [demoPaceSeconds, setDemoPaceSeconds] = useState<number>(6);
  const [liveCycleData, setLiveCycleData] = useState<any | null>(null);
  const [datasetFrame, setDatasetFrame] = useState<number>(0);
  const [timelineEvents, setTimelineEvents] = useState<LiveTimelineEvent[]>([]);

  // Sensor badges mandated by SIH specifications
  const [sensorBadges, setSensorBadges] = useState<SensorStatusBadges>({
    telemetry: 'LIVE',
    network_state: 'LIVE',
    ai: 'RUNNING',
    llm: 'CONNECTED',
    deception: 'INACTIVE'
  });

  // Live Backend Data
  const [livePrediction, setLivePrediction] = useState<LivePredictionState | null>({
    currentStage: 'Reconnaissance',
    predictedStage: 'Discovery',
    confidence: 0.88,
    risk: 'LOW',
    affectedAssets: ['edge_firewall_01', 'load_balancer_01'],
    modelVersion: 'PyTorch LSTM v1.0.0 [ACTIVE]'
  });
  const [liveObjectives, setLiveObjectives] = useState<LiveObjectiveState | null>({
    credentials: 0.35,
    database: 0.35,
    admin: 0.30,
    primary: 'database',
    explanation: 'Initial telemetry indicates target reconnaissance directed at internal database subnets.'
  });
  const [liveNetworkState, setLiveNetworkState] = useState<Record<string, any> | null>(null);
  const [liveRisk, setLiveRisk] = useState<Record<string, any> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const liveTimerRef = useRef<any>(null);
  const demoTimerRef = useRef<any>(null);

  // Sync mode status from backend on mount
  useEffect(() => {
    const syncStatus = async () => {
      try {
        const status = await getSystemModeStatusApi();
        if (status) {
          if (status.mode) setSystemMode(status.mode);
          if (status.sensors) {
            setSensorBadges({
              telemetry: status.sensors.telemetry || 'LIVE',
              network_state: status.sensors.network_state || 'LIVE',
              ai: status.sensors.ai_world_model === 'RUNNING' ? 'RUNNING' : 'STANDBY',
              llm: status.sensors.llm_reasoning === 'CONNECTED' ? 'CONNECTED' : 'FALLBACK',
              deception: status.sensors.deception === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
            });
          }
        }
      } catch (e) {
        console.warn('Mode status sync warning:', e);
      }
    };

    const loadTimeline = async () => {
      try {
        const events = await fetchLiveTimelineApi();
        if (Array.isArray(events)) {
          setTimelineEvents(events);
        }
      } catch (e) {
        console.warn('Timeline initial load warning:', e);
      }
    };

    syncStatus();
    loadTimeline();
  }, []);

  // Fetch initial live ML data from backend
  useEffect(() => {
    const loadInitialLiveMLData = async () => {
      try {
        const [predRes, objRes] = await Promise.all([
          fetchAttackPathPrediction().catch(() => null),
          fetchObjectivesCurrent().catch(() => null)
        ]);

        if (predRes && predRes.prediction) {
          setLivePrediction({
            currentStage: predRes.prediction.current_stage || 'Reconnaissance',
            predictedStage: predRes.prediction.predicted_next_stage || 'Discovery',
            confidence: predRes.prediction.confidence || 0.85,
            risk: predRes.prediction.risk || 'LOW',
            affectedAssets: predRes.prediction.affected_assets || [],
            modelVersion: predRes.prediction.model_version || 'PyTorch LSTM v1.0.0 [ACTIVE]'
          });
        }

        if (objRes && objRes.objectives) {
          const creds = objRes.objectives.find((o: any) => o.objective === 'credentials')?.current_probability || 0.35;
          const db = objRes.objectives.find((o: any) => o.objective === 'database')?.current_probability || 0.35;
          const adm = objRes.objectives.find((o: any) => o.objective === 'administrative_access')?.current_probability || 0.30;
          setLiveObjectives({
            credentials: creds,
            database: db,
            admin: adm,
            primary: objRes.primary_objective || 'database',
            explanation: objRes.explanation || 'Calculated from live Bayesian evidence.'
          });
        }
      } catch (err) {
        console.warn('Initial live ML fetch warning:', err);
      }
    };

    loadInitialLiveMLData();
  }, []);

  // Central WebSocket connection and message router
  useEffect(() => {
    const ws = createClosedLoopWebSocket((message: WSEventMessage) => {
      setActiveStage(message.event_type);
      setRecentWsEvents((prev) => [message, ...prev.slice(0, 49)]);

      const payload = message.payload;
      if (!payload) return;

      if (message.event_type === 'prediction_update') {
        setLivePrediction((prev) => ({
          currentStage: prev?.currentStage || 'Discovery',
          predictedStage: payload.active_threat_level === 'CRITICAL' ? 'Exfiltration' : 'Lateral Movement',
          confidence: payload.security_risk ? Math.min(0.99, Math.max(0.50, 1 - payload.security_risk * 0.3)) : 0.88,
          risk: payload.active_threat_level || 'ELEVATED',
          affectedAssets: ['Auth-Service-01', 'API-Gateway-01', 'Postgres-DB-01'],
          modelVersion: 'PyTorch LSTM v1.0.0 [ACTIVE]',
          nextState: payload
        }));
      } else if (message.event_type === 'network_state_update') {
        setLiveNetworkState(payload);
      } else if (message.event_type === 'risk_update') {
        setLiveRisk(payload);
        if (payload.current_stage) {
          setLivePrediction((prev) => prev ? {
            ...prev,
            currentStage: payload.current_stage,
            predictedStage: payload.predicted_next_stage || prev.predictedStage,
            confidence: payload.confidence || prev.confidence,
            risk: payload.risk || prev.risk
          } : null);
        }
      } else if (message.event_type === 'deception_update') {
        setSensorBadges((prev) => ({
          ...prev,
          deception: payload.is_active ? 'ACTIVE' : 'INACTIVE'
        }));
      } else if (message.event_type === 'objective_update') {
        if (payload.objectives) {
          const creds = payload.objectives.find((o: any) => o.objective === 'credentials')?.current_probability || 0.35;
          const db = payload.objectives.find((o: any) => o.objective === 'database')?.current_probability || 0.35;
          const adm = payload.objectives.find((o: any) => o.objective === 'administrative_access')?.current_probability || 0.30;
          setLiveObjectives({
            credentials: creds,
            database: db,
            admin: adm,
            primary: payload.primary_objective || 'database',
            explanation: payload.explanation || ''
          });
        }
      }
    });

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    wsRef.current = ws;

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const refreshTimeline = async () => {
    try {
      const events = await fetchLiveTimelineApi();
      if (Array.isArray(events)) {
        setTimelineEvents(events);
      }
    } catch (e) {
      console.warn('Failed to refresh timeline:', e);
    }
  };

  // Switch between the three modes
  const switchSystemMode = async (mode: SystemExecutionMode) => {
    try {
      await setSystemModeApi(mode);
      setSystemMode(mode);
      if (mode === 'LIVE_CONTROLLED_TEST') {
        setIsLiveMode(true);
        setJudgeDemoActive(false);
        setEnvironment('LOCAL DEFENCE LAB');
      } else if (mode === 'DATASET_REPLAY') {
        setIsLiveMode(true);
        setJudgeDemoActive(false);
        setEnvironment('DATASET REPLAY');
      } else {
        setIsLiveMode(false);
        setJudgeDemoActive(true);
        setEnvironment('JUDGE DEMO');
      }
      await refreshTimeline();
    } catch (e) {
      console.error('Mode switch failed:', e);
    }
  };

  // Execute single live testbed step
  const stepLiveTest = async () => {
    try {
      const cycle = await stepLiveTestbedApi();
      if (cycle) {
        setLiveCycleData(cycle);
        if (cycle.current_state) {
          setLiveNetworkState(cycle.current_state);
          setLiveRisk({
            risk: cycle.current_state.security_risk,
            threat_level: cycle.current_state.active_threat_level
          });
        }
        if (cycle.predicted_state) {
          setLivePrediction((prev) => ({
            currentStage: cycle.attack_stage || prev?.currentStage || 'Discovery',
            predictedStage: cycle.predicted_next_stage || prev?.predictedStage || 'Lateral Movement',
            confidence: cycle.confidence || 0.88,
            risk: cycle.current_state?.active_threat_level || 'ELEVATED',
            affectedAssets: ['edge_firewall_01', 'api_gateway_01', 'decoy_db_01'],
            modelVersion: 'PyTorch LSTM v1.0.0 [ACTIVE]',
            nextState: cycle.predicted_state
          }));
        }
        if (cycle.primary_objective) {
          setLiveObjectives((prev) => prev ? {
            ...prev,
            primary: cycle.primary_objective
          } : null);
        }
        setSensorBadges((prev) => ({
          ...prev,
          deception: cycle.deception_active ? 'ACTIVE' : 'INACTIVE'
        }));
      }
      await refreshTimeline();
    } catch (e) {
      console.error('stepLiveTest failed:', e);
    }
  };

  // Automated continuous live test loop
  useEffect(() => {
    if (isLiveTestRunning && systemMode === 'LIVE_CONTROLLED_TEST') {
      liveTimerRef.current = setInterval(() => {
        stepLiveTest();
      }, demoPaceSeconds * 1000);
    } else {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    }

    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [isLiveTestRunning, systemMode, demoPaceSeconds]);

  const startLiveTest = async () => {
    setIsLiveTestRunning(true);
    await stepLiveTest();
  };

  const stopLiveTest = async () => {
    setIsLiveTestRunning(false);
  };

  const resetLiveEnvironment = async () => {
    setIsLiveTestRunning(false);
    try {
      await resetLiveTestbedApi();
      setTimelineEvents([]);
      setLiveCycleData(null);
      setSensorBadges((prev) => ({ ...prev, deception: 'INACTIVE' }));
    } catch (e) {
      console.error('Reset live environment failed:', e);
    }
  };

  const stepDatasetReplay = async () => {
    try {
      const res = await stepDatasetReplayApi();
      if (res && res.state) {
        setDatasetFrame(res.frame_index);
        setLiveNetworkState(res.state);
        if (res.predicted_state) {
          setLivePrediction((prev) => ({
            currentStage: 'Dataset Playback',
            predictedStage: 'Predicted Horizon',
            confidence: 0.92,
            risk: res.state.active_threat_level || 'ELEVATED',
            affectedAssets: ['benchmark_host_01', 'benchmark_server_02'],
            modelVersion: 'PyTorch LSTM v1.0.0 [ACTIVE]',
            nextState: res.predicted_state
          }));
        }
      }
      await refreshTimeline();
    } catch (e) {
      console.error('stepDatasetReplay failed:', e);
    }
  };

  // Handle Judge Demo automated stepping timer (11 steps)
  useEffect(() => {
    if (judgeDemoActive && systemMode === 'JUDGE_DEMO') {
      demoTimerRef.current = setInterval(() => {
        fetch(`${API_BASE_URL}/judge-demo/step`, { method: 'POST' }).catch(() => {});
        setJudgeDemoStep((prev) => {
          const next = prev >= 11 ? 1 : prev + 1;
          const stepData = DEMO_STAGES[next - 1];
          setActiveStage(stepData.activeStage);
          return next;
        });
      }, demoPaceSeconds * 1000);
    } else {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    }

    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    };
  }, [judgeDemoActive, systemMode, demoPaceSeconds]);

  const startJudgeDemo = () => {
    fetch(`${API_BASE_URL}/judge-demo/trigger?seed=42`, { method: 'POST' }).catch(() => {});
    setEnvironment('JUDGE DEMO');
    setSystemMode('JUDGE_DEMO');
    setIsLiveMode(false);
    setJudgeDemoActive(true);
    setJudgeDemoStep(1);
    setActiveStage(DEMO_STAGES[0].activeStage);
  };

  const triggerDeterministicDemo = (seed: number = 42) => {
    fetch(`${API_BASE_URL}/judge-demo/trigger?seed=${seed}`, { method: 'POST' }).catch(() => {});
    setEnvironment('JUDGE DEMO');
    setSystemMode('JUDGE_DEMO');
    setIsLiveMode(false);
    setJudgeDemoActive(true);
    setJudgeDemoStep(1);
    setActiveStage(DEMO_STAGES[0].activeStage);
  };

  const stopJudgeDemo = () => {
    setJudgeDemoActive(false);
  };

  const resetJudgeDemo = () => {
    fetch(`${API_BASE_URL}/judge-demo/reset`, { method: 'POST' }).catch(() => {});
    setJudgeDemoStep(1);
    setActiveStage(DEMO_STAGES[0].activeStage);
  };

  const setJudgeDemoStepIndex = (stepNum: number) => {
    if (stepNum >= 1 && stepNum <= 11) {
      setJudgeDemoStep(stepNum);
      setActiveStage(DEMO_STAGES[stepNum - 1].activeStage);
    }
  };

  const currentDemoStepData = DEMO_STAGES[judgeDemoStep - 1] || DEMO_STAGES[0];

  return (
    <RealtimeContext.Provider
      value={{
        wsConnected,
        activeStage,
        systemMode,
        switchSystemMode,
        sensorBadges,
        timelineEvents,
        refreshTimeline,
        startLiveTest,
        stopLiveTest,
        stepLiveTest,
        resetLiveEnvironment,
        isLiveTestRunning,
        liveCycleData,
        stepDatasetReplay,
        datasetFrame,
        judgeDemoActive,
        judgeDemoStep,
        currentDemoStepData,
        startJudgeDemo,
        stopJudgeDemo,
        resetJudgeDemo,
        triggerDeterministicDemo,
        setJudgeDemoStepIndex,
        isLiveMode,
        setIsLiveMode,
        recentWsEvents,
        livePrediction,
        liveObjectives,
        liveNetworkState,
        liveRisk,
        demoPaceSeconds,
        setDemoPaceSeconds,
        isLiveLoopRunning: isLiveTestRunning,
        triggerLiveStep: stepLiveTest,
        startLiveLoop: startLiveTest,
        stopLiveLoop: stopLiveTest
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
