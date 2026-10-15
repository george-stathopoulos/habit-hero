import { create } from 'zustand';

export interface OnboardingChild {
  name: string;
  gender: string;
  avatarId: number;
  pin: string;
}

export interface OnboardingGoal {
  id: string;
  label_el: string;
  label_en: string;
  description_el: string;
  icon: string;
  categories: string[];
}

export const ONBOARDING_GOALS: OnboardingGoal[] = [
  {
    id: 'school',
    label_el: 'Σχολικές Δραστηριότητες',
    label_en: 'School Activities',
    description_el: 'Διάβασμα, μαθήματα, οργάνωση',
    icon: '📚',
    categories: ['education'],
  },
  {
    id: 'hygiene',
    label_el: 'Υγιεινή',
    label_en: 'Hygiene',
    description_el: 'Βούρτσισμα δοντιών, πλύσιμο χεριών',
    icon: '🧼',
    categories: ['hygiene'],
  },
  {
    id: 'physical',
    label_el: 'Φυσική Δραστηριότητα',
    label_en: 'Physical Activity',
    description_el: 'Άθληση, παιχνίδι, κίνηση',
    icon: '⚽',
    categories: ['health'],
  },
  {
    id: 'organization',
    label_el: 'Οργάνωση & Ρουτίνα',
    label_en: 'Organization & Routine',
    description_el: 'Τακτοποίηση, ξύπνημα, ύπνος',
    icon: '🗂️',
    categories: ['organization', 'routine'],
  },
  {
    id: 'social',
    label_el: 'Κοινωνικές Δεξιότητες',
    label_en: 'Social Skills',
    description_el: 'Μοίρασμα, βοήθεια, συνεργασία',
    icon: '🤝',
    categories: ['social'],
  },
  {
    id: 'creativity',
    label_el: 'Δημιουργικότητα',
    label_en: 'Creativity',
    description_el: 'Ζωγραφική, κατασκευές, DIY',
    icon: '🎨',
    categories: ['creativity'],
  },
  {
    id: 'responsibility',
    label_el: 'Υπευθυνότητα',
    label_en: 'Responsibility',
    description_el: 'Φροντίδα, καθήκοντα, βοήθεια',
    icon: '⭐',
    categories: ['responsibility'],
  },
];

interface OnboardingState {
  step: number;
  totalSteps: number;
  // Parent info (from Google)
  parentId: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPicture: string | null;
  parentPin: string;
  tempSessionId: string | null;
  // Child info
  child: OnboardingChild | null;
  childId: string | null;
  // Goals
  selectedGoals: string[];
  // Selected habits
  selectedHabits: string[];
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setParentInfo: (info: { id: string; name: string; email: string; picture?: string; tempSessionId: string }) => void;
  setParentPin: (pin: string) => void;
  setChild: (child: OnboardingChild) => void;
  setChildId: (id: string) => void;
  toggleGoal: (goalId: string) => void;
  toggleHabit: (habitId: string) => void;
  setSelectedHabits: (habits: string[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: 1,
  totalSteps: 6,
  parentId: null,
  parentName: null,
  parentEmail: null,
  parentPicture: null,
  parentPin: '',
  tempSessionId: null,
  child: null,
  childId: null,
  selectedGoals: [],
  selectedHabits: [],

  setStep: (step) => set({ step }),
  
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, state.totalSteps) })),
  
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  setParentInfo: (info) => set({
    parentId: info.id,
    parentName: info.name,
    parentEmail: info.email,
    parentPicture: info.picture,
    tempSessionId: info.tempSessionId,
  }),

  setParentPin: (pin) => set({ parentPin: pin }),

  setChild: (child) => set({ child }),

  setChildId: (id) => set({ childId: id }),

  toggleGoal: (goalId) => set((state) => {
    const goals = state.selectedGoals.includes(goalId)
      ? state.selectedGoals.filter((g) => g !== goalId)
      : [...state.selectedGoals, goalId];
    return { selectedGoals: goals };
  }),

  toggleHabit: (habitId) => set((state) => {
    const habits = state.selectedHabits.includes(habitId)
      ? state.selectedHabits.filter((h) => h !== habitId)
      : [...state.selectedHabits, habitId];
    return { selectedHabits: habits };
  }),

  setSelectedHabits: (habits) => set({ selectedHabits: habits }),

  reset: () => set({
    step: 1,
    parentId: null,
    parentName: null,
    parentEmail: null,
    parentPicture: null,
    parentPin: '',
    tempSessionId: null,
    child: null,
    childId: null,
    selectedGoals: [],
    selectedHabits: [],
  }),
}));
