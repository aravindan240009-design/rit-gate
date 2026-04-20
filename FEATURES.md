# RITGate — Features & Workflows

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native 0.81 (Android APK) |
| Backend | Spring Boot 3 (Java), hosted on Render |
| Database | MySQL (Railway) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Local Notifications | @notifee/react-native |
| Auth | OTP via Brevo email API |

---

## User Roles

| Role | ID Format | Description |
|------|-----------|-------------|
| Student | Reg No (e.g. `2117240030037`) | Requests gate passes, views QR, history |
| Staff (Teaching) | Staff Code (e.g. `CS195`) | Approves student requests, creates own/bulk passes |
| HOD | HOD Code (e.g. `CS56`) | Approves staff-forwarded requests, creates bulk passes |
| HR | HR Code | Final approval layer for all gate passes |
| Non-Teaching Faculty (NTF) | Staff Code | Own gate pass requests only |
| Non-Class Incharge (NCI) | Staff Code | Own gate pass requests only |
| Security | Security ID (e.g. `SEC001`) | QR scanner, visitor/vehicle management |
| Admin Officer | Staff Code | Gate log viewer (all user types including visitors) |

---

## Authentication

- OTP-based login — no passwords
- OTP sent to registered email via Brevo
- Session persisted in AsyncStorage (auto-login on reopen)
- Biometric gate on app reopen after kill (fingerprint / device PIN)
- Battery optimization gate on first launch (ensures background notifications work)
- FCM push token registered on every login, deleted on logout

**Endpoints:** `POST /api/auth/{role}/send-otp` → `POST /api/auth/{role}/verify-otp`

---

## Gate Pass Approval Chains

### Student Single Gate Pass
```
Student submits
  → Staff notified (push + in-app)
  → Staff approves → Student + HOD notified
  → HOD approves  → Student notified (QR ready)
  → Any rejection → Student notified with remark
```

### Staff / HOD Single Gate Pass
```
Staff/HOD submits
  → HOD notified
  → HOD approves → HR notified
  → HR approves  → Staff/HOD notified (QR ready)
  → Any rejection → Staff/HOD notified with remark
```

### Staff Bulk Gate Pass
```
Staff selects students + optional self
  → Assigns QR receiver (staff or a student)
  → HOD approves → HR approves → QR issued to receiver
  → All participants notified
```

### HOD Bulk Gate Pass
```
HOD selects students + staff from all their departments
  → No HR approval required
  → HOD holds QR (or assigns receiver)
  → All participants notified
```

### Visitor / Guest Pass
```
Staff/HOD/NTF pre-registers visitor
  → Instant QR + manual code generated
  → Visitor arrives → Security scans QR
  → If staff doesn't respond in 5 min → escalated to Security
  → Security approves/rejects escalated visitors
```

---

## Status Values

| Status | Meaning |
|--------|---------|
| `PENDING_STAFF` | Awaiting staff approval |
| `PENDING_HOD` | Staff approved, awaiting HOD |
| `PENDING_HR` | HOD approved, awaiting HR |
| `APPROVED` | Fully approved, QR available |
| `REJECTED` | Rejected at any stage |
| `USED` / `EXITED` | QR already scanned at gate |

---

## Student Features

- **Home tab** — Request Gate Pass card (disabled after 3 PM IST), Recent Requests list (today only, scrollable)
- **Requests tab** — All today's requests with status badges (AWAITING STAFF / AWAITING HOD / APPROVED / REJECTED)
- **History tab** — Entry/exit scan history with stats (total entries, exits)
- **Profile tab** — Photo (camera/gallery), email/phone edit, theme toggle, logout
- **Request Status modal** — Timeline showing each approval stage with remarks
- **QR Code modal** — Shows QR + manual entry code for approved passes

---

## Staff Features

- **Dashboard** — Incoming student requests (today only), tabs: Pending / Approved / Rejected
- **My Requests** — Own gate pass requests (today only)
- **New Pass** → PassTypeBottomSheet:
  - Single Gate Pass (self)
  - Bulk Gate Pass (students from class)
  - Pre-register Guest (instant visitor QR)
- **Approve/Reject** — SinglePassDetailsModal with remark field (required for rejection)
- **Bulk pass details** — BulkDetailsModal showing all participants
- **Visitor requests** — Approve/reject walk-in visitor requests

---

## HOD Features

- **Dashboard** — All incoming requests (students + staff + visitors, today only)
- **My Requests** — Own gate pass requests
- **HOD Bulk Gate Pass** — Select from ALL departments they manage (multi-department support)
  - Filter by Year / Department / Section
  - Include HOD in pass (HOD holds QR)
  - Select staff participants
- **Approve/Reject** — Single and bulk pass modals

---

## HR Features

- **Dashboard** — All requests reaching HR stage (today only), Pending / Approved / Rejected tabs
- **My Requests** — Own gate pass requests
- **Gate Logs** — Combined entry + exit log for students and staff
  - Date range picker (calendar)
  - Export to PDF (downloaded to device)
- **HOD Bulk Pass approval** — Approve/reject bulk passes from HODs

---

## Security Features

- **Dashboard stats** — Active (visitors on campus), Entries today, Exited today
  - Auto-refresh every 60s + midnight reset
- **Active Persons list** — Visitors currently on campus (entered, not exited)
  - Manual exit button per person
- **Escalated Visitors** — Visitors whose staff didn't respond in 5 min
  - Approve / Reject with reason
- **QR Scanner** — Camera-based scan for entry/exit
  - Manual code entry fallback
  - Late entry scan (student/staff ID)
- **Scan History** — Recent scans with person details
- **Visitor Registration** — Register walk-in visitors manually
- **Vehicle Registration** — Log vehicle entry/exit, search by plate
- **HOD Contacts** — Quick reference list of all department HODs

---

## Notification System

### Tables
- `notifications` — stores all notification records (user_id, title, message, type, is_read, action_route)
- `user_push_tokens` — stores FCM device token per user (registered on login, deleted on logout)

### Delivery
1. Backend event fires → `NotificationService.save()` writes to `notifications` table
2. `PushNotificationService.sendToUser()` looks up FCM token → calls Firebase HTTP v1 API
3. **Foreground**: FCM delivers to app → notifee shows OS banner
4. **Background/Killed**: FCM shows OS banner natively
5. Frontend polls every 15s → `GET /api/notifications/{userType}/{userId}` → shows unread (last 24h)

### Deduplication
- Shared `@ritgate_shown_notif_ids` AsyncStorage key prevents re-showing same notification via both FCM and polling

### Notification Types
| Type | Trigger |
|------|---------|
| `GATE_PASS` | New request submitted |
| `APPROVAL` | Request approved at any stage |
| `REJECTION` | Request rejected |
| `BULK_PASS` | Bulk pass QR issued to participant |
| `ENTRY` / `EXIT` | Visitor entry/exit recorded |

---

## Bottom Navigation

All dashboards have a fixed bottom nav bar:
- **Student**: Home / Requests / History / Profile
- **Staff / HOD / NTF / NCI**: Home / New Pass / My Requests / Profile
- **HR**: Home / New Pass / My Requests / Gate Logs / Profile
- **Security**: Home / Scanner / History / Vehicles / Profile

Bottom nav sits above OS navigation bar using `useSafeAreaInsets`.

---

## Pull-to-Refresh

All list screens support pull-to-refresh via `TopRefreshControl` (custom PanResponder-based, works even when list has data). Header is inside the refresh zone; bottom nav is outside.

---

## Today-Only Filtering

All request lists (dashboards + My Requests pages) show **today's requests only** — no pending requests from previous days are shown, regardless of status.

---

## QR Code

- Generated by backend on full approval
- Contains encoded gate pass data (`GP|...` / `ST|...` / `SF|...`)
- Has expiry time (`qr_expires_at` column)
- One-time use — marked `USED` after scan
- Manual entry code as fallback (shown alongside QR)

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Root navigation, auth state, notification routing |
| `frontend/src/services/api.service.ts` | All API calls (120s timeout, 1 retry on 5xx) |
| `frontend/src/config/api.config.ts` | Backend URL (`https://rit-gate.onrender.com/api`) |
| `frontend/src/context/NotificationContext.tsx` | Notification polling, badge count, dedup |
| `frontend/src/services/pushNotification.service.ts` | FCM token registration, foreground handler |
| `frontend/src/services/localNotification.service.ts` | notifee channel + OS banner display |
| `frontend/src/utils/dateUtils.ts` | IST date formatting, relative time |
| `backend/src/main/java/.../service/NotificationService.java` | All notification triggers |
| `backend/src/main/java/.../service/PushNotificationService.java` | FCM HTTP v1 API calls |
| `backend/src/main/resources/application.properties` | DB + mail config |

---

## Build & Deploy

### Android APK
```bash
cd frontend/android
./gradlew assembleRelease --build-cache
# Output: app/build/outputs/apk/release/app-release.apk
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Backend (Render)
- Auto-deploys on push to `main` branch
- Dockerfile at `backend/Dockerfile`
- Health check: `GET https://rit-gate.onrender.com/api/health`
- Free tier cold start: ~60s (app sends wake-up ping on launch)

### Git Repos
- `https://github.com/opopnomi-coder/ritgate` (primary)
- `https://github.com/aravindan240009-design/rit-gate` (mirror)

---

## Environment Variables (Render)

| Variable | Purpose |
|----------|---------|
| `SPRING_DATASOURCE_URL` | Railway MySQL connection string |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `BREVO_API_KEY` | Email OTP service |
| `BREVO_SENDER_EMAIL` | From address for OTP emails |
| `FIREBASE_PROJECT_ID` | FCM project |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | FCM service account (full JSON) |
| `SERVER_PORT` | Backend port (default 8080) |
