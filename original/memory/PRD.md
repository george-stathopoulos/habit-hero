# Habit Hero - Product Requirements Document

## Overview
Habit Hero is a family-focused habit tracking app for children. Parents create and manage habits/tasks, children complete them to earn points and rewards.

## Original Problem Statement
Build a comprehensive habit tracking app for families where:
- Parents can create, manage, and assign habits to their children
- Children earn points by completing habits
- Points can be redeemed for rewards set by parents
- The app supports multiple children per family
- Both Google OAuth and Magic Link (passwordless email) authentication for parents

## Tech Stack
- **Frontend**: React Native (Expo), TypeScript, Expo Router, Zustand
- **Backend**: Python, FastAPI, MongoDB
- **Authentication**: Google OAuth (Emergent Auth), Magic Link (Brevo email)
- **Push Notifications**: Expo Push SDK

## Core Features Implemented

### Authentication
- Google OAuth login for parents
- Magic Link (passwordless) login via Brevo email service
- **NEW**: Email + PIN direct login (for returning users after magic link setup)
- PIN-based authentication for returning users
- Separate child login with PIN
- Full logout vs. user switching support

### Parent Dashboard
- Create and manage custom habits
- Preset habits with age-appropriate suggestions
- Assign habits to specific children
- Points history with filters (by child, date range)
- Summary stats (earned, spent, lost points)
- Approval workflow for pending completions
- Reward management (one-time and recurring)

### Child Dashboard
- View assigned habits
- Mark habits complete
- Redeem rewards with points
- Track streaks and progress
- Avatar levels (15 levels up to 10,000 points)

### Navigation
- Custom back buttons on all pages
- PIN-based switching between family members
- Role-based routing (parent/child)

## Recent Changes (Feb 2026)

### Session: Feb 17, 2026 (Help & Feedback Feature)
- **NEW**: Help & Feedback page for parents at `/app/frontend/app/parent/help-feedback.tsx`
  - Beta version banner explaining the app is in development
  - Request for user feedback with examples (likes, ideas, bugs, suggestions)
  - Text area for sending messages
  - Messages sent via Brevo email to `habit.hero.kids@gmail.com`
  - Also stored in `feedback` MongoDB collection for reference
- **NEW**: Backend endpoint `POST /api/feedback` for sending feedback emails
- **Updated**: Settings menu "Βοήθεια" link now navigates to the new Help & Feedback page

### Session: Feb 17, 2026 (Earlier)
- **Fixed**: Parent onboarding alert message now correctly points to "Ρυθμίσεις" (Settings) for switch user feature
- **Refactored**: Removed verbose debug logging from server.py (UPDATE HABIT endpoint)
- **Verified**: Logout flow correctly clears all data and redirects to welcome slides
- **Verified**: Child onboarding intro slides show only on first login (checks AsyncStorage flag)

### NEW: Parent Onboarding Guide Page
- Created `/app/frontend/app/parent/onboarding-guide.tsx`
- 6-page interactive guide with styled mockup cards explaining:
  1. Switch user icon (for child login)
  2. Adding habits
  3. Approving child activities
  4. Rewards system
  5. Avatar settings
  6. Inactivity penalty
- Shows only once after first child creation
- Uses AsyncStorage flag `parent_onboarding_guide_seen_${userId}`

### NEW: Child System Notifications for Feature Changes
- When parent enables **Custom Avatar**: Child receives notification explaining the new feature
- When parent enables/disables **Inactivity Penalty**: Child receives notification explaining the rules
- Notifications appear in child's in-app notification system

### NEW: Simplified Child Home Screen (4-Tile Dashboard)
- Replaced crowded home screen with 4 big tile-based dashboard
- Tiles: My Habits, Rewards, Progress, Profile
- 3 selectable UI styles stored in AsyncStorage:
  - **Playful** (🎈): Large emojis, bright pastel colors
  - **Modern** (✨): Gradient icons, sleek design  
  - **Game-like** (🎮): Dark theme with neon glows
- UI style selector added to child profile page
- New dedicated pages created:
  - `/app/frontend/app/child/habits-page.tsx` - Full habits list with progress
  - `/app/frontend/app/child/progress-page.tsx` - Stats, badges, streaks

### Magic Link Email + PIN Login Fix
**Problem**: After signing up via magic link email (browser flow), users couldn't easily login when reopening the app because:
1. The app showed the welcome/registration screen
2. No option existed to login with existing account

**Solution Implemented**:
1. Added "Έχω ήδη λογαριασμό (Email + PIN)" option on welcome screen
2. Created email lookup endpoint (`/api/auth/lookup-by-email`)
3. Two-step login modal: Enter email → Enter PIN → Login
4. App now supports returning magic link users

### New API Endpoints
- `POST /api/auth/lookup-by-email` - Look up parent account by email
- `POST /api/auth/magic-link/poll` - Poll for magic link verification status

### Magic Link Polling (for in-app verification)
- When app stays open during browser verification, it auto-logs in user via polling
- `poll_token` returned when requesting magic link
- App polls every 3 seconds to detect verification completion

## Known Issues

### P1: Expo Web Build Broken
- The Expo web preview has a JavaScript error: `import.meta` syntax error
- Workaround: Magic Link verification uses a standalone HTML page served by the backend

## Database Collections
- `parents`: Parent accounts (email, name, PIN hash, push tokens)
- `children`: Child profiles (name, gender, age, avatar, points)
- `habits`: Habit definitions (preset and custom)
- `completions`: Task completion records
- `redemptions`: Reward redemption history
- `rewards`: Parent-defined rewards
- `magic_links`: Temporary passwordless login tokens (with poll_token)
- `points_history`: Point adjustments and penalties
- `feedback`: User feedback messages with sender info and timestamps

## Key API Endpoints
- `POST /api/auth/magic-link/request` - Request magic link email
- `POST /api/auth/magic-link/verify` - Verify magic link token
- `POST /api/auth/magic-link/poll` - Poll for verification status
- `GET /api/magic-verify` - Standalone HTML verification page
- `POST /api/auth/magic-link/complete-setup` - Complete new user registration
- `POST /api/auth/parent-pin-login` - PIN login for existing parents
- `POST /api/auth/lookup-by-email` - Find parent by email
- `GET /api/parent/comprehensive-points-history` - Full points history
- `POST /api/feedback` - Send feedback email to developers

## Environment Configuration
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name (test_database)
- `BREVO_API_KEY`: Email service API key
- `SENDER_EMAIL`: Verified sender email for magic links

## Session: Feb 17, 2026 (Parent Theme Overhaul)
- **UPDATED**: Replaced childish parent themes with mature, professional options
- **NEW THEMES FOR PARENTS**:
  1. **Classic** (default) - Neutral blue/yellow professional colors
  2. **Coder** - Terminal/hacker style with matrix green on black
  3. **Minimal** - Clean two-tone (black/white) with dotted lines and geometric styling
- **Children retain playful themes**: Princess, Hero, Unicorn, Ninja, Nature
- **NEW**: Created `/app/frontend/app/parent/child-settings.tsx` - dedicated page grouping:
  - Avatar Photo settings per child
  - Inactivity Penalty settings per child
- **UPDATED**: Settings page now has single "Ρυθμίσεις Παιδιών" link instead of inline sections
- **Files modified**:
  - `/app/frontend/src/constants/themes.ts` - Added `PARENT_THEMES`, `CHILD_THEMES`, coder/minimal themes
  - `/app/frontend/app/parent/theme-selector.tsx` - Now uses `PARENT_THEMES`
  - `/app/frontend/src/components/ThemeSelector.tsx` - Smart selection based on user type
  - `/app/frontend/app/child/(tabs)/profile.tsx` - Now uses `CHILD_THEMES`
  - `/app/frontend/app/parent/(tabs)/settings.tsx` - Simplified with link to child-settings page

## Backlog / Future Tasks
- P1: Implement deep linking for seamless magic link redirect to app
- P1: Unify "add child" flows (onboarding vs post-login)
- P1: Parent photo avatars cloud storage (currently uses local device URIs)
- P2: Fix Expo web build `import.meta` error
- P3: "Basic vs. Advanced" view toggle
- P3: More comprehensive activity logging
- P3: Remove unused `/app/frontend/app/auth/magic.tsx` file
