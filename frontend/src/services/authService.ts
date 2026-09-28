import { User, UserRole, AuthSession } from '../types/auth';

const STORAGE_KEY = 'defence_ai_session';
const API_BASE_URL = 'http://localhost:8000/api/v1';

export const SEEDED_USERS: User[] = [
  {
    id: 'usr-admin-01',
    name: 'Kunal (Admin)',
    email: 'admin@defence.local',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 03:30'
  },
  {
    id: 'usr-analyst-01',
    name: 'Sarah Chen (SOC Analyst)',
    email: 'analyst@defence.local',
    role: 'SOC_ANALYST',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 03:25'
  },
  {
    id: 'usr-eng-01',
    name: 'Marcus Vance (SecOps Eng)',
    email: 'engineer@defence.local',
    role: 'SECURITY_ENGINEER',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 03:15'
  },
  {
    id: 'usr-viewer-01',
    name: 'Audit Observer',
    email: 'viewer@defence.local',
    role: 'VIEWER',
    status: 'ACTIVE',
    lastLogin: '2026-09-04 03:00'
  }
];

export const authService = {
  login: async (email: string, pass: string, remember: boolean = true): Promise<AuthSession> => {
    // 1. Attempt live backend authentication
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: pass || 'adminpassword123' })
      });

      if (response.ok) {
        const session: AuthSession = await response.json();
        if (remember) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        }
        return session;
      }
    } catch (err) {
      console.warn('Backend auth unreachable, falling back to local verification:', err);
    }

    // 2. Client-side fallback if backend API offline
    const matched = SEEDED_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matched) {
      if (matched.status !== 'ACTIVE') {
        throw new Error('User account is currently disabled or locked.');
      }
      const session: AuthSession = {
        token: `jwt-demo-${matched.role.toLowerCase()}-${Date.now()}`,
        user: matched,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        environment: 'LOCAL DEFENCE LAB'
      };
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
      return session;
    }

    // Generic fallback for any user login during demo
    const defaultUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0] || 'Operator',
      email: email,
      role: 'SOC_ANALYST',
      status: 'ACTIVE',
      lastLogin: new Date().toISOString()
    };
    const session: AuthSession = {
      token: `jwt-demo-soc_analyst-${Date.now()}`,
      user: defaultUser,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      environment: 'LOCAL DEFENCE LAB'
    };
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  },

  getCurrentSession: (): AuthSession | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEY);
  },

  switchUserRole: (newRole: UserRole): AuthSession | null => {
    const session = authService.getCurrentSession();
    if (!session) return null;
    const targetUser = SEEDED_USERS.find((u) => u.role === newRole) || {
      ...session.user,
      role: newRole
    };
    const updated: AuthSession = {
      ...session,
      token: `jwt-demo-${newRole.toLowerCase()}-${Date.now()}`,
      user: targetUser
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};
