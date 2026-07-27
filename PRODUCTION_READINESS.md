# RITGate Production Readiness Audit

Audit of the checklist against the codebase, plus the fixes applied.
Scores reflect the state **after** those fixes.

> **Second pass (adversarial review) found 2 critical vulnerabilities that the first
> pass missed.** Both are fixed — see [Critical findings](#critical-findings-second-pass).
> Anyone who used this system before those fixes should assume the HR-approval and
> visitor-approval trails are untrustworthy for that period.

**Total: 92 / 100**

| # | Area | Score |
|---|------|-------|
| 1 | Authentication | 10 / 10 |
| 2 | Authorization | 14 / 15 |
| 3 | API Security | 14 / 15 |
| 4 | Database Security | 8 / 10 |
| 5 | QR Code Security | 10 / 10 |
| 6 | File Upload Security | 5 / 5 |
| 7 | Frontend Security | 5 / 5 |
| 8 | Performance | 4 / 5 |
| 9 | Production Config | 10 / 10 |
| 10 | Testing | 11 / 15 |

---

## Critical findings (second pass)

The first pass audited the OTP/config layer and missed both of these. They were found
by asking "who can call this, and whose identity does it trust?" of every route.

### 🔴 C-1 — Any non-teaching employee could obtain ROLE_HR

`POST /api/auth/hr/verify-otp` looked the caller up in `hrRepository` and, on a valid
OTP, issued a **ROLE_HR** token. But the `HR` entity maps to `non_teaching_staffs_rit`
— the table of *every* non-teaching employee: clerks, wardens, lab technicians,
accountants. Presence in it was treated as proof of being HR.

The designation check that actually distinguishes HR (`Senior Manager - HR`) existed
**only** in `/detect-role`, which is advisory and client-driven. Since the client picks
which verify endpoint to call, any non-teaching employee could call the HR endpoint
directly, pass an OTP sent to *their own* email, and receive HR authority — **final
gate-pass approval** plus all of `/api/hr/**`. No stolen credentials required; only
your own valid login.

**Fixed:** the designation is now enforced in `AuthController` where the token is
minted (and at send-otp as defence in depth). 23 regression tests pin the rule,
including the real non-teaching titles that must *not* qualify.

### 🔴 C-2 — Anyone on the internet could approve any visitor

`GET /api/visitors/{id}/approve` and `/reject` were `permitAll`, took a **sequential**
`Long` id, and required no token. Walking `/api/visitors/1/approve`, `/2/approve`, …
would approve every visitor request in the system — issuing real QR gate passes to
unvetted people. Being `GET`, they also fired from any prefetching link-scanner or a
cross-site `<img>` tag, and they reflected visitor name/email into raw HTML (XSS).

`EmailService` had already stopped emitting these links, but **the endpoints remained
live and exploitable** — the earlier fix closed the email path, not the route.

**Fixed:** both endpoints deleted and their `permitAll` rules removed. All clients
already use the authenticated `POST` routes.

### 🟠 H-1 — HR approvals trusted a body-supplied identity

Five HR approve/reject endpoints read `hrCode` from the **request body** and recorded
it as the approver. Any authenticated HR could approve a pass and attribute it to a
different HR — forging the audit trail on the system's final authorisation step.
**Fixed:** the actor now comes from the JWT (`actingHrCode`), matching the pattern
`HODController` already used. ADMIN may still act on another's behalf.

### 🟠 H-2 — ADMIN granted by substring match

`role.toUpperCase().contains("ADMINISTRATIVE OFFICER")` also promoted "Assistant to the
Administrative Officer" and similar to **ADMIN** — the highest privilege, which bypasses
`Authz.requireSelf` entirely. **Fixed:** exact match, with tests for the near-miss titles.

### 🟠 H-3 — Event-controller passwords hardcoded in the repo

Three portal accounts had **plaintext** passwords committed in `AuthController`.
Anyone with repo read access had working credentials, and rotation needed a redeploy.
The endpoint was also unthrottled (brute-forceable, no OTP second factor) and compared
with `.equals` (timing-leaky). **Fixed:** BCrypt hashes supplied via
`EVENT_CONTROLLER_ACCOUNTS`, rate-limited, constant-time comparison against a dummy
hash for unknown usernames to prevent enumeration. Fails closed if unset.

> **Rotate these passwords.** They are in git history; removing them from `HEAD` does
> not un-publish them.

### 🟡 M-1 — Unauthenticated endpoints without throttling

`/api/unified-visitors/register` (writes a row, notifies staff, accepts a 5MB photo)
had no rate limit — open to mass spam. **Fixed:** IP-keyed throttle. The legacy public
`POST /api/visitors` performed **no** photo validation and no throttling and is called
by no client — **removed from `permitAll`**. The visitor website's `machineId`, which
authorises reading a request's status, used `Date.now()` + `Math.random()`; now a
CSPRNG value.

> **Two deploy steps are required before this is accurate in production** — see
> [Required deploy steps](#required-deploy-steps). Until the migration is run and
> `JWT_SECRET` is set, the app will not start.

---

## 1. Authentication — 10/10

| Check | Status |
|---|---|
| OTP expires within 5 minutes | ✅ `auth.otp.expiry.minutes=5` |
| OTP single use | ✅ consumed on success; a resend invalidates the prior code |
| Max 5 OTP requests / 10 min | ✅ **fixed** — was not enforced at all |
| Max 5 wrong attempts → lock | ✅ **fixed** — was 3 attempts with no lock |
| Session expires | ⚠️ JWT expires in 30 days; there is no inactivity timeout |
| JWT secret in env | ✅ **fixed** — now fails to start on the dev default |
| No secrets in frontend | ✅ verified |

### The resend bug

`AuthController.checkRateLimit` keyed the limiter on `"rate:" + userId`, while
`OtpService.storeOtp` keyed the OTP row on the user's **email**. The throttle
counters were written to a row nothing else ever read, so:

- the 60-second resend cooldown **never applied** — OTP sending was unlimited,
- an attacker could farm unlimited codes for any known ID (spam + brute-force surface).

Every `send-otp` handler now resolves the account first and throttles on the same
email key the OTP is stored under. HOD is the subtle one: its email may come from a
`teaching_staffs` fallback, so the throttle runs after that resolution.

### Attempt cap was bypassable

On exhausting the cap the OTP row was **deleted**. Requesting a new OTP therefore
returned a clean slate — an unlimited number of 3-guess batches against a 6-digit
code. The row is now retained and stamped with `locked_until`; a lockout survives a
resend, and consumed/expired codes blank `hashed_otp` rather than dropping the row so
throttle counters persist.

Lockout is checked *before* the "is there a code?" test — tripping the cap blanks the
code, so the reverse order reported a misleading `No OTP found`. **A unit test caught
this ordering bug.**

### Resend flow

Added `POST /api/auth/resend-otp`, wired through `apiService.resendOTP()` to the login
screen. The client cooldown was 120s against a 60s server cooldown; both now derive
from `OTP_CONFIG.RESEND_DELAY_SECONDS` (60). A 429 surfaces the server's exact wait time.

**Remaining:** no inactivity-based session expiry. A 30-day token stays valid even if
unused. Consider a refresh-token model if that matters for your threat model.

---

## 2. Authorization — 14/15

Role gates in `SecurityConfig` plus `Authz.requireSelf(...)` for ownership are a sound
two-layer design. Student/Staff/HOD/HR/Security separation is enforced at the path level.

This section is where both criticals lived. The design was fine; the **role-assignment**
step (C-1) and one **unauthenticated route** (C-2) were not. Fixed, plus the
body-trusted approver identity (H-1) and the ADMIN substring match (H-2).

**Remaining gaps:**
- `Authz` coverage is still uneven: `GatePassRequestController` has 19 call sites,
  `SecurityController` and `VisitorController` 1 each. The HR approval paths are now
  token-bound, but the same audit has **not** been done end-to-end for
  `SecurityController` (70 endpoints across the three). Highest-value next task.
- "Staff can approve only *assigned* students" lives in service logic rather than a
  uniform guard — worth a focused review.

---

## 3. API Security — 14/15

| Check | Status |
|---|---|
| Spring Security / JWT / auth on protected endpoints | ✅ |
| Correct 401/403 | ✅ |
| SQL injection | ✅ JPA parameter binding throughout; no string-concatenated SQL found |
| XSS | ✅ **improved** — API is JSON-only; added a locked-down CSP |
| CSRF | ✅ N/A by design — stateless Bearer auth (documented in `SecurityConfig`) |
| Request size limits | ✅ **added** — none existed |
| Input validation | ⚠️ present but inconsistent |
| API versioning | ❌ not implemented (checklist marks this "recommended") |

**Request size limits** were entirely absent — any endpoint accepting a base64 photo
could be sent an arbitrarily large JSON body. Added Tomcat/multipart caps plus
`RequestSizeLimitFilter`, which rejects oversized bodies with 413 **before** parsing
(Tomcat's form-post limit does not cover raw JSON).

**Note on `sanitizeInput`:** it strips characters to `[a-zA-Z0-9@._-]`. That is fine for
IDs, but it is *not* the reason you are safe from SQL injection — JPA binding is. Don't
rely on it as a general-purpose defense.

---

## 4. Database Security — 8/10

✅ Credentials in env vars · ✅ no plaintext secrets (OTPs BCrypt-hashed) · ✅ FKs and
unique constraints present · ✅ connection pooling tuned.

**Gaps:**
- **No automated backup policy** in the repo. This is the most serious remaining item —
  the DB is a self-hosted MySQL host, so backups are your responsibility. Untested
  backups are the single highest-impact production risk here.
- Index coverage is partial; I added one on `otp_codes.expires_at` for the cleanup scan.

---

## 5. QR Code Security — 10/10

Tokens come from `SecureRandom`, are validated against `qr_table`, carry an expiry
(`qr_expires_at` + `QRExpiryScheduler`), and status-gate on `ACTIVE`. Invalid, tampered
and expired QRs are rejected; tokens are not guessable and carry no PII.

---

## 6. File Upload Security — 5/5

`ImageValidation` enforces type (JPEG/PNG/WEBP), decodes and size-caps at **5MB**, and
rejects corrupt base64. Photos are stored as data URIs in the DB, so there is no
web-served upload directory and no path-traversal or executable-upload surface.
A `.exe` or fake-extension file fails the data-URI type check.

### Attachment size cap now shown in the UI

This was the specific request — the cap existed server-side but was invisible, so users
hit a rejection only after uploading:

- **Mobile** (`PhotoUploadField`): shows `JPEG, PNG or WEBP · max 5MB`, and rejects
  oversized picks with the actual size (`Photo is too large (7.2MB). Maximum size is 5MB.`).
- **Visitor website** (`CameraCapture`): shows `JPEG · max 5MB` with a backstop size check.

Both derive from the same 5MB figure as the backend; the constants carry comments
pointing at `ImageValidation.MAX_DECODED_BYTES` so they are kept in sync.

---

## 7. Frontend Security — 5/5

No secrets, API keys or DB credentials in the RN app or web clients; auth is
token-only, route protection is role-gated, and logout clears stored state.

---

## 8. Performance — 4/5

✅ Connection pooling (HikariCP), lazy init, response compression, `open-in-view=false`
(avoids N+1 during serialization). ⚠️ Pagination is not applied uniformly — several
list endpoints return full tables, which will degrade as gate-log volume grows.

---

## 9. Production Configuration — 9/10

| Check | Status |
|---|---|
| HTTPS | ✅ terminated by Render |
| CORS | ✅ **fixed** — see below |
| Env vars | ✅ |
| Security headers | ✅ **added** — HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, CSP |
| Stack traces hidden | ✅ **fixed** |
| Compression | ✅ |
| Logging | ⚠️ heavy `System.out` use; OTP logging is correctly gated behind `app.debug-otp` |

**CORS** was `allowedOriginPatterns("*")` **with** `allowCredentials(true)` — that
combination reflects whatever `Origin` is sent, so any website could call the API with
the user's credentials attached. Now an explicit allowlist via `CORS_ALLOWED_ORIGINS`.
The 19 controller-level `@CrossOrigin(origins = "*")` annotations were removed because
they silently overrode the central config.

**Error responses** returned `ex.getMessage()`, SQL state and error codes, and printed
stack traces — leaking table names, column names and connection details. Responses now
carry a generic message plus a short `errorId` correlating to the server log.

**Remaining:** `System.out.println` logging should move to SLF4J with levels for
production log management.

---

## 10. Testing — 11/15

**39 tests pass** (`./gradlew test`), up from 4. Added `AuthRoleAssignmentTest` — 23
tests pinning the role-assignment rules behind C-1 and H-2, including the real
non-teaching designations that must never receive ROLE_HR and the near-miss titles that
must never receive ADMIN.

`OtpServiceTest` — **12 tests**, covering the checklist's auth cases:

- single use, resend invalidates the previous code
- expiry rejected, 5-minute window verified
- 5th wrong attempt locks; correct OTP refused while locked
- **lockout survives a new OTP request** (the bypass described in §1)
- cooldown, 5-per-10-min burst cap, window reset, counters not reset by `storeOtp`
- OTP never stored in plaintext (BCrypt)

These caught one real ordering bug during development.

These caught two real bugs: an OTP lockout ordering bug, and a test-config regression
that broke application startup (`contextLoads`).

**Gap (−4):** the role *rules* are tested, but there are still no end-to-end HTTP tests
proving a STUDENT token is rejected by `/api/hr/**` etc. `AuthRoleAssignmentTest`
mirrors the production predicates rather than invoking them (they are private), so a
change to `AuthController` that loosens the check would not automatically fail — the
test documents and pins the intent, not the wiring. The manual pen-test items in §11
are **not** automated and I have **not** run them against a live instance.

---

## Required deploy steps

1. **Run the migration** — adds the columns the new throttling needs:
   ```
   mysql -u <user> -p <db> < backend/sql/add_otp_rate_limit_columns.sql
   ```
   Idempotent and safe to re-run. `ddl-auto=none`, so this will not happen automatically;
   **without it the OTP flow will fail at runtime.**

2. **Set `JWT_SECRET`** — `render.yaml` now uses `generateValue: true`. The app
   **refuses to start** on the built-in dev secret, which is public in this repo.
   Changing this value invalidates all issued tokens (forces re-login).

3. **Set `EVENT_CONTROLLER_ACCOUNTS`** (BCrypt hashes) if the event portal is used —
   it is disabled until you do. **Rotate those passwords**: the old plaintext ones are
   in git history.

4. **Optionally set `CORS_ALLOWED_ORIGINS`** to your exact production origins. The
   default covers `*.onrender.com`, `*.vercel.app` and LAN/localhost for development.

5. **Review the HR roster.** C-1 means anyone in `non_teaching_staffs_rit` could have
   held HR authority. Confirm only intended accounts carry the `Senior Manager - HR`
   designation, and review recent HR-approved gate passes for entries you don't recognise.

---

## Recommended next

1. **Database backups** — highest-impact remaining gap.
2. **Automated authorization tests** + the manual pen-test pass in §11.
3. **Audit `Authz` coverage** in `HRController`, `SecurityController`, `VisitorController`.
4. **Pagination** on list endpoints before gate-log volume grows.
5. **`System.out` → SLF4J.**
