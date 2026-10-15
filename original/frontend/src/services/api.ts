import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: object;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const sessionToken = useAuthStore.getState().sessionToken;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (sessionToken) {
    requestHeaders['Authorization'] = `Bearer ${sessionToken}`;
  }

  const url = `${BACKEND_URL}/api${endpoint}`;
  
  // Debug logging for PUT requests
  if (method === 'PUT') {
    console.log('=== API PUT REQUEST ===');
    console.log('URL:', url);
    console.log('Session Token:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'NONE');
    console.log('Body:', JSON.stringify(body));
  }
  
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  // Debug logging for response
  if (method === 'PUT') {
    console.log('Response status:', response.status);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

// Auth APIs
export const authAPI = {
  exchangeSession: (sessionId: string) => 
    fetch(`${BACKEND_URL}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      credentials: 'include',
    }).then(r => r.json()),

  setupPin: (tempSessionId: string, pin: string) =>
    apiRequest<any>('/auth/setup-pin', {
      method: 'POST',
      body: { temp_session_id: tempSessionId, pin },
    }),

  parentPinLogin: (parentId: string, pin: string) =>
    fetch(`${BACKEND_URL}/api/auth/parent-pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: parentId, pin }),
      credentials: 'include',
    }).then(r => {
      if (!r.ok) throw new Error('Invalid PIN');
      return r.json();
    }),

  verifyPinNewDevice: (userId: string, pin: string, tempSessionToken: string) =>
    fetch(`${BACKEND_URL}/api/auth/verify-pin-new-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, pin, temp_session_token: tempSessionToken }),
      credentials: 'include',
    }).then(r => {
      if (!r.ok) throw new Error('Invalid PIN');
      return r.json();
    }),

  childLogin: (childId: string, pin: string) =>
    fetch(`${BACKEND_URL}/api/auth/child-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ child_id: childId, pin }),
      credentials: 'include',
    }).then(r => {
      if (!r.ok) throw new Error('Invalid PIN');
      return r.json();
    }),

  getFamilyInfo: (parentId: string) =>
    fetch(`${BACKEND_URL}/api/family/${parentId}`).then(r => {
      if (!r.ok) throw new Error('Family not found');
      return r.json();
    }),

  getMe: () => apiRequest<any>('/auth/me'),
  
  getChildMe: () => apiRequest<any>('/auth/child/me'),

  logout: () => apiRequest<any>('/auth/logout', { method: 'POST' }),

  deleteAccount: () => apiRequest<any>('/auth/delete-account', { method: 'DELETE' }),
};

// Children APIs
export const childrenAPI = {
  getAll: () => apiRequest<any[]>('/children'),
  
  create: (data: { name: string; gender: string; pin: string; avatar_id?: number }) =>
    apiRequest<any>('/children', { method: 'POST', body: data }),

  update: (childId: string, data: { name?: string; gender?: string; avatar_id?: number }) =>
    apiRequest<any>(`/children/${childId}`, { method: 'PUT', body: data }),

  delete: (childId: string) =>
    apiRequest<any>(`/children/${childId}`, { method: 'DELETE' }),

  getByParent: (parentId: string) =>
    fetch(`${BACKEND_URL}/api/children/by-parent/${parentId}`).then(r => r.json()),
};

// Habits APIs
export const habitsAPI = {
  getPreset: (age?: number) => {
    const url = age ? `/habits/preset?age=${age}` : '/habits/preset';
    return apiRequest<any[]>(url);
  },
  
  getAll: () => apiRequest<any[]>('/habits'),

  getSuggestions: (childId: string) =>
    apiRequest<any>(`/habits/suggestions/${childId}`),

  create: (data: {
    name_el: string;
    name_en: string;
    points?: number;
    category?: string;
    categories?: string[];
    verification_type?: string;
    emoji?: string;
    frequency_type?: string;
    frequency_count?: number;
    weekly_mode?: string;
    frequency_days?: number[];
    assigned_child_ids?: string[];
    description_el?: string;
    why_important_el?: string;
    parent_tip_el?: string;
    retry_delay_value?: number;
    retry_delay_unit?: string;
  }) => apiRequest<any>('/habits', { method: 'POST', body: data }),

  update: (habitId: string, data: {
    name_el?: string;
    name_en?: string;
    points?: number;
    category?: string;
    categories?: string[];
    verification_type?: string;
    emoji?: string;
    frequency_type?: string;
    frequency_count?: number;
    weekly_mode?: string;
    frequency_days?: number[];
    is_active?: boolean;
    assigned_child_ids?: string[];
    description_el?: string;
    why_important_el?: string;
    parent_tip_el?: string;
    retry_delay_value?: number;
    retry_delay_unit?: string;
  }) => apiRequest<any>(`/habits/${habitId}`, { method: 'PUT', body: data }),

  delete: (habitId: string) =>
    apiRequest<any>(`/habits/${habitId}`, { method: 'DELETE' }),
    
  // Get which children have this habit
  getChildAssignments: (habitId: string) =>
    apiRequest<any[]>(`/habits/${habitId}/children`),
    
  // Update which children have this habit
  updateChildAssignments: (habitId: string, childIds: string[]) =>
    apiRequest<any>(`/habits/${habitId}/children`, { 
      method: 'PUT', 
      body: { child_ids: childIds } 
    }),
};

// Categories APIs
export const categoriesAPI = {
  getAll: () => apiRequest<any[]>('/categories'),
  
  create: (data: { name_el: string; color?: string; emoji?: string }) =>
    apiRequest<any>('/categories', { method: 'POST', body: data }),
    
  update: (categoryId: string, data: { name_el?: string; color?: string; emoji?: string }) =>
    apiRequest<any>(`/categories/${categoryId}`, { method: 'PUT', body: data }),
    
  delete: (categoryId: string) =>
    apiRequest<any>(`/categories/${categoryId}`, { method: 'DELETE' }),
};

// Love Credits APIs
export const loveCreditsAPI = {
  send: (data: { child_ids: string[]; amount: number; icon: string; message: string }) =>
    apiRequest<any>('/parent/send-love-credits', { method: 'POST', body: data }),
    
  getHistory: () => apiRequest<any[]>('/parent/love-credits-history'),
  
  getChildHistory: () => apiRequest<any[]>('/child/love-credits-history'),
  
  getChildStats: () => apiRequest<{ total_points: number; total_count: number }>('/child/love-credits-stats'),
  
  checkReminder: () => apiRequest<any>('/parent/love-credits-reminder'),
};

// Child Tasks APIs
export const tasksAPI = {
  getTasks: () => apiRequest<any[]>('/child/tasks'),
  
  complete: (habitId: string) =>
    apiRequest<any>(`/child/tasks/${habitId}/complete`, { method: 'POST' }),

  postpone: (habitId: string) =>
    apiRequest<any>(`/child/tasks/${habitId}/postpone`, { method: 'POST' }),
    
  getPostponed: () => apiRequest<any>('/child/postponed-tasks'),

  getProgress: () => apiRequest<any>('/child/progress'),
};

// Child Habit Assignment APIs
export const childHabitsAPI = {
  getAssignedHabits: (childId: string) =>
    apiRequest<any>(`/children/${childId}/habits`),
  
  assignHabits: (childId: string, habitIds: string[]) =>
    apiRequest<any>(`/children/${childId}/habits`, {
      method: 'PUT',
      body: { child_id: childId, habit_ids: habitIds },
    }),
};

// Child Notifications APIs
export const childNotificationsAPI = {
  getAll: () => apiRequest<any[]>('/child/notifications'),
  
  getCount: () => apiRequest<{ count: number }>('/child/notifications/count'),
  
  markAllRead: () =>
    apiRequest<any>('/child/notifications/read', { method: 'POST' }),
  
  markRead: (notificationId: string) =>
    apiRequest<any>(`/child/notifications/${notificationId}/read`, { method: 'POST' }),
  
  claimLoveCredits: (notificationId: string) =>
    apiRequest<any>(`/child/claim-love-credits/${notificationId}`, { method: 'POST' }),
};

// Parent Approval APIs
export const approvalAPI = {
  getPending: () => apiRequest<any[]>('/parent/pending-approvals'),
  
  getHistory: () => apiRequest<any[]>('/parent/approval-history'),
  
  approve: (completionId: string) =>
    apiRequest<any>(`/parent/approve/${completionId}`, { method: 'POST' }),

  reject: (completionId: string) =>
    apiRequest<any>(`/parent/reject/${completionId}`, { method: 'POST' }),
    
  encourageRetry: (completionId: string) =>
    apiRequest<any>(`/parent/encourage-retry/${completionId}`, { method: 'POST' }),
};

// Help Requests APIs
export const helpRequestsAPI = {
  getAll: () => apiRequest<any[]>('/parent/help-requests'),
  
  resolve: (helpId: string) =>
    apiRequest<any>(`/parent/help-requests/${helpId}/resolve`, { method: 'POST' }),

  completeOnBehalf: (helpId: string) =>
    apiRequest<any>(`/parent/help-requests/${helpId}/complete`, { method: 'POST' }),
    
  encourageRetry: (helpId: string) =>
    apiRequest<any>(`/parent/help-requests/${helpId}/encourage-retry`, { method: 'POST' }),
};

// Custom Avatar APIs
export const customAvatarAPI = {
  // Parent endpoints
  getSettings: (childId: string) =>
    apiRequest<{ enabled: boolean; mode: string; has_custom_avatar: boolean; total_points: number }>(
      `/parent/child/${childId}/custom-avatar-settings`
    ),
  
  updateSettings: (childId: string, enabled: boolean, mode: string) =>
    apiRequest<any>(`/parent/child/${childId}/custom-avatar-settings`, {
      method: 'PUT',
      body: { child_id: childId, enabled, mode }
    }),
  
  // Child endpoints
  getStatus: () =>
    apiRequest<{
      enabled: boolean;
      mode: string;
      can_use: boolean;
      has_custom_avatar: boolean;
      custom_avatar: string | null;
      total_points: number;
      points_needed: number;
      has_photo_badge: boolean;
    }>('/child/custom-avatar-status'),
  
  upload: (imageBase64: string) =>
    apiRequest<any>('/child/custom-avatar', {
      method: 'POST',
      body: { image_base64: imageBase64 }
    }),
  
  remove: () =>
    apiRequest<any>('/child/custom-avatar', { method: 'DELETE' }),
};

// Inactivity Penalty APIs
export const inactivityPenaltyAPI = {
  getSettings: (childId: string) =>
    apiRequest<{ enabled: boolean; points_deduction: number; time_period_hours: number }>(
      `/parent/child/${childId}/inactivity-penalty-settings`
    ),
  
  updateSettings: (childId: string, enabled: boolean, pointsDeduction: number = 10, timePeriodHours: number = 24) =>
    apiRequest<any>(`/parent/child/${childId}/inactivity-penalty-settings`, {
      method: 'PUT',
      body: { enabled, points_deduction: pointsDeduction, time_period_hours: timePeriodHours }
    }),
};

// Redemption History APIs
export const redemptionAPI = {
  getHistory: () => apiRequest<any[]>('/parent/redemption-history'),
};

// Rewards APIs
export const rewardsAPI = {
  // Parent endpoints
  getAll: () => apiRequest<any[]>('/rewards'),
  
  create: (data: {
    name_el: string;
    name_en?: string;
    description_el?: string;
    points_cost: number;
    emoji?: string;
    child_ids?: string[];
    is_recurring?: boolean;
  }) => apiRequest<any>('/rewards', { method: 'POST', body: data }),

  update: (rewardId: string, data: {
    name_el?: string;
    description_el?: string;
    points_cost?: number;
    emoji?: string;
    is_recurring?: boolean;
  }) => apiRequest<any>(`/rewards/${rewardId}`, { method: 'PUT', body: data }),

  delete: (rewardId: string) =>
    apiRequest<any>(`/rewards/${rewardId}`, { method: 'DELETE' }),

  getPendingRedemptions: () =>
    apiRequest<any[]>('/parent/redemptions'),

  getPendingRedemptionsCount: () =>
    apiRequest<{ count: number }>('/parent/redemptions/count'),

  fulfillRedemption: (redemptionId: string) =>
    apiRequest<any>(`/parent/redemptions/${redemptionId}/fulfill`, { method: 'POST' }),

  // Child endpoints
  getForChild: () =>
    apiRequest<{ rewards: any[]; current_points: number }>('/child/rewards'),

  redeem: (rewardId: string) =>
    apiRequest<any>(`/child/rewards/${rewardId}/redeem`, { method: 'POST' }),
};

// Points History APIs
export const pointsHistoryAPI = {
  // Get child's spending history
  getChildHistory: () =>
    apiRequest<any>('/child/points-history'),
  
  // Get all children's spending history (for parent)
  getParentChildrenHistory: () =>
    apiRequest<any[]>('/parent/children-points-history'),

  // Get child dashboard summary
  getChildDashboard: () =>
    apiRequest<any>('/child/dashboard-summary'),
};

// Analytics APIs
export const analyticsAPI = {
  getChildAnalytics: (childId: string) =>
    apiRequest<any>(`/parent/analytics/${childId}`),
};

// Badges & Avatars APIs
export const gamificationAPI = {
  getBadges: () => apiRequest<any[]>('/badges'),
  getAvatarLevels: () => apiRequest<any[]>('/avatars'),
};

// Push Notification APIs
export const pushAPI = {
  register: (pushToken: string, platform: string, deviceName?: string) =>
    apiRequest<any>('/push/register', {
      method: 'POST',
      body: { push_token: pushToken, platform, device_name: deviceName },
    }),

  unregister: (pushToken: string, platform: string) =>
    apiRequest<any>('/push/unregister', {
      method: 'POST',
      body: { push_token: pushToken, platform },
    }),
};
