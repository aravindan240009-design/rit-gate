# RITGate — App Documentation & Working Procedure

## Overview

RITGate is a college gate pass management system built with:
- **Frontend**: React Native (Expo) — Android APK
- **Backend**: Spring Boot (Java) — hosted on Render (free tier)
- **Database**: PostgreSQL

---

## User Roles

| Role | Description |
|------|-------------|
| Student | Requests gate passes, views QR codes and history |
| Staff | Requests own gate passes, creates bulk passes for students, approves/rejects student requests |
| HOD | Approves/rejects gate pass requests forwarded by staff, creates bulk passes |
| HR | Final approval layer for gate pass requests |
| Security | Scans QR codes at gate, registers visitors and vehicles, views scan history |

---

## Authentication Flow

All roles use **OTP-based login** (no passwords):

1. User selects their role on the login screen
2. Enters their ID (Reg No / Staff Code / HOD Code / HR Code / Security ID)
3. OTP is sent to their registered email
4. User enters OTP → logged in

Backend endpoints: `/api/auth/{role}/send-otp` and `/api/auth/{role}/verify-otp`

---

## Student Flow

```
Login → Student Dashboard
  ├── Home Tab
  │     ├── Request Gate Pass (single)
  │     │     └── Fill purpose, reason, optional attachment → Submit
  │     └── View active QR code (if approved)
  ├── Requests Tab
  │     └── View all requests with status (PENDING / APPROVED / REJECTED)
  │           └── Tap approved request → View QR Code
  ├── History Tab
  │     └── Entry/exit scan history
  └── Profile Tab
        ├── Change profile photo (camera or gallery)
        ├── Edit email/phone
        ├── Theme selector
        └── Logout
```

### Gate Pass Approval Chain (Student)
```
Student submits → Staff approves → HOD approves → APPROVED (QR generated)
                                                 → REJECTED (at any stage)
```

---

## Staff Flow

```
Login → Staff Dashboard
  ├── Pending Approvals
  │     ├── View student gate pass requests pending staff approval
  │     ├── Tap card → Single Pass Details Modal (approve/reject with remark)
  │     └── Bulk passes → Bulk Details Modal
  ├── My Requests
  │     ├── Own single gate pass requests
  │     └── Own bulk gate pass requests
  ├── Bulk Gate Pass
  │     ├── Select students from department list
  │     ├── Optionally include self (staff holds QR)
  │     ├── Select receiver student (QR holder) if staff not included
  │     ├── Fill purpose, reason, optional attachment
  │     └── Submit → goes to HOD for approval
  └── Profile
```

---

## HOD Flow

```
Login → HOD Dashboard
  ├── Pending Approvals
  │     └── Approve/reject requests forwarded from staff
  ├── My Requests
  │     └── Own gate pass requests
  ├── Bulk Gate Pass
  │     └── Create bulk passes (same flow as staff)
  └── Profile
```

---

## HR Flow

```
Login → HR Dashboard
  └── Pending Approvals
        └── Final approval layer — approve/reject requests from HOD
```

---

## Security Flow

```
Login → Security Dashboard
  ├── Scan QR Code
  │     ├── Camera-based QR scanner
  │     ├── Validates gate pass (single or bulk)
  │     └── Records entry/exit scan log
  ├── Scan History
  │     └── Recent scans with person details
  ├── Visitor Registration
  │     └── Register walk-in visitors manually
  ├── Vehicle Registration
  │     └── Log vehicle entry/exit
  ├── HOD Contacts
  │     └── Quick reference for department HODs
  └── Profile
```

---

## Gate Pass Types

### Single Gate Pass
- One person (student or staff)
- Requires: purpose, reason, optional attachment
- QR code generated on full approval

### Bulk Gate Pass
- Multiple students + optionally the requesting staff
- One QR code issued to the "receiver" (staff or selected student)
- Security scans once for the entire group

---

## Approval Status Values

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting staff approval |
| `PENDING_HOD` | Staff approved, awaiting HOD |
| `APPROVED` | Fully approved, QR available |
| `REJECTED` | Rejected at any stage |

---

## Profile Photo (Gallery/Camera)

The app requests permission before accessing photos:

- **First time**: System permission dialog appears
- **Denied once**: App shows explanation and re-requests
- **Permanently denied**: App shows "Open Settings" button to enable manually

Permissions used:
- `READ_MEDIA_IMAGES` (Android 13+)
- `READ_MEDIA_VISUAL_USER_SELECTED` (Android 14+ partial access)
- `READ_EXTERNAL_STORAGE` (Android ≤ 12)
- `CAMERA` (for take photo option)

---

## Backend API Base URL

Configured in `frontend/src/config/api.config.ts` and `frontend/.env`.

The backend runs on Render free tier — first request after inactivity may take ~60 seconds (cold start). The app sends a wake-up ping on launch to minimize this delay.

---

## Building the APK

```powershell
# From ritgate-main/frontend/android/
.\build-release.ps1
```

Output APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Backend Deployment

Configured via `ritgate-main/render.yaml`. The Spring Boot app auto-deploys on push to the connected branch.

Environment variables (set in Render dashboard):
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `MAIL_USERNAME` / `MAIL_PASSWORD` (for OTP emails)

---

## Key File Locations

| File | Purpose |
|------|---------|
| `frontend/src/services/api.service.ts` | All API calls |
| `frontend/src/context/ThemeContext.tsx` | Theme/dark mode |
| `frontend/src/context/ProfileContext.tsx` | Profile photo (camera/gallery) |
| `frontend/src/context/ActionLockContext.tsx` | Prevents double-tap submissions |
| `frontend/src/App.tsx` | Root navigation / auth state |
| `backend/src/main/resources/application.properties` | Backend config |
| `frontend/android/app/src/main/AndroidManifest.xml` | Android permissions |
