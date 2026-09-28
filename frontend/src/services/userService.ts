import { User, UserRole } from '../types/auth';
import { SEEDED_USERS } from './authService';
import { fetchUsersApi, createUserApi, updateUserRoleApi, toggleUserStatusApi } from './api';

let usersStore: User[] = [...SEEDED_USERS];

export const userService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const data = await fetchUsersApi();
      if (Array.isArray(data) && data.length > 0) {
        usersStore = data;
        return data;
      }
    } catch (e) {
      console.warn('Backend users API unavailable, using local store:', e);
    }
    return [...usersStore];
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    try {
      const created = await createUserApi({
        name: user.name,
        email: user.email,
        role: user.role
      });
      usersStore.push(created);
      return created;
    } catch (e) {
      console.warn('Backend user create API unavailable, persisting locally:', e);
      const newUser: User = {
        ...user,
        id: `usr-${Date.now()}`
      };
      usersStore.push(newUser);
      return newUser;
    }
  },

  updateUserRole: async (userId: string, newRole: UserRole): Promise<User> => {
    try {
      const updated = await updateUserRoleApi(userId, newRole);
      const idx = usersStore.findIndex((u) => u.id === userId);
      if (idx !== -1) usersStore[idx] = updated;
      return updated;
    } catch (e) {
      const idx = usersStore.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      usersStore[idx] = { ...usersStore[idx], role: newRole };
      return usersStore[idx];
    }
  },

  toggleUserStatus: async (userId: string): Promise<User> => {
    try {
      const updated = await toggleUserStatusApi(userId);
      const idx = usersStore.findIndex((u) => u.id === userId);
      if (idx !== -1) usersStore[idx] = updated;
      return updated;
    } catch (e) {
      const idx = usersStore.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      const current = usersStore[idx].status;
      usersStore[idx] = {
        ...usersStore[idx],
        status: current === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
      };
      return usersStore[idx];
    }
  }
};
