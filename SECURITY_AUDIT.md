# Security Audit — Employee Attendance App

**Scope:** backend API (`/backend`) and Expo client (`/frontend`).
**Audit date:** initial build.

## 1. Controls already in place

### Authentication & authorisation
- Passwords hashed with **bcrypt** (cost 12 by default, configurable via `BCRYPT_SALT_ROUNDS`).
- JWT signed with server-side secret; tokens expire (default 7 days, configurable).
- Role-based middleware: `authRequired` + `adminOnly`.
- First-time password change is enforced before allowing attendance check-in.
- Admin password from `.env` is **never** committed — `.env.example` only.

### Input validation
- All write endpoints validated with **Joi** schemas (`src/validators/schemas.js`).
- Strict password policy (8+ chars, upper + lower + digit).
- Mobile normalised to 10 digits.

### HTTP hardening
- `helmet` — secure HTTP headers (CSP, HSTS on prod reverse proxy recommended).
- `cors` — configurable allow-list via `CLIENT_ORIGIN`.
- `express-rate-limit` — global 300 req/min; strict limits on login (10/10min) and register (5/hr).
- `express-mongo-sanitize` — strips `$`/`.` operators to prevent NoSQL injection.
- `hpp` — HTTP parameter pollution.
- `xss-clean` — basic XSS sanitisation on request bodies.
- `x-powered-by` disabled.

### File upload
- `multer` memory storage, 8 MB limit.
- MIME allow-list (`image/jpeg|png|webp`).
- Files streamed directly to Cloudinary — nothing written to disk.

### Data model
- Unique indexes on `username`, `mobile`, `email`, and `(user, date)` for attendance.
- `password` and `faceDescriptor` have `select: false` (never returned by default).
- `toSafeJSON()` strips sensitive fields before API responses.

### Email flow
- Temporary passwords are **generated with Node `crypto.randomInt`**, 12 chars, 4 classes required.
- Tokens/credentials are never logged in production.

### Operations
- Docker image runs as the non-root `node` user.
- GitHub Actions pipeline:
  - `ci.yml`: lint + tests + `npm audit` + **CodeQL** SAST on every PR.
  - `security-audit.yml`: weekly `npm audit`.
  - `deploy-backend.yml`: pushes signed Docker images to GHCR on `main`.

## 2. Identified risks & mitigations

| # | Risk | Severity | Mitigation (done / todo) |
|---|---|---|---|
| 1 | Seeded admin has **well-known credentials** (as required) | **High** | MUST change on first production deploy. Consider rotating via `/scripts/seedAdmin.js` with `ADMIN_PASSWORD` from a secret manager. |
| 2 | No account lockout after N failed logins | Medium | Mitigated by `express-rate-limit`. Todo: persistent per-user lockout, e.g. lock after 10 failures/1h. |
| 3 | JWT stored in `AsyncStorage` on device | Medium | Acceptable for MVP. Upgrade path: `expo-secure-store` on native, HttpOnly cookie for web. |
| 4 | Face verification can be bypassed if client omits descriptor | High | Backend logs this case. Todo: enforce server-side face recognition (AWS Rekognition or face-api.js in Node with TF models). |
| 5 | No CSRF tokens | Low | API is stateless bearer-token; CSRF is n/a for mobile app. If exposed to browsers with cookies, add `csurf`. |
| 6 | No audit log for admin actions | Medium | Todo: `AuditLog` collection capturing approve/reject/delete with actor + reason. |
| 7 | Dependencies not pinned via lockfile yet | Medium | Commit `package-lock.json` on first `npm install`; CI already calls `npm ci` first. |
| 8 | CORS defaults to `*` in dev | Low | Set `CLIENT_ORIGIN` to a comma-separated allow-list in production. |
| 9 | No email verification for registrations | Medium | Todo: send verification link to `email` before admin sees the request. |
| 10 | Image uploads not virus-scanned | Low | Todo: ClamAV sidecar, or Cloudinary's moderation add-on. |
| 11 | Cloudinary URLs are public | Medium | Todo: switch to **signed delivery URLs** with short TTL for attendance photos. |
| 12 | No HSTS / TLS enforced at app layer | Medium | Terminate TLS at reverse proxy (NGINX / ALB). Add HSTS header there. |
| 13 | Logs may leak PII (email, mobile) in errors | Low | `error.js` hides stack traces in production; keep logs scrubbed. |
| 14 | No backup strategy documented | Medium | Todo: `mongodump` cron to S3/GCS; Cloudinary auto-backup to S3. |
| 15 | Rate limits are per-IP only | Low | Use `X-Forwarded-For` only behind trusted proxy; `app.set('trust proxy', 1)` is set — verify proxy chain. |

## 3. OWASP ASVS quick check (level 1)

- **V1 Architecture**: stateless JWT API, documented flows ✅
- **V2 Authentication**: strong bcrypt, mandatory rotation, rate-limited ✅
- **V3 Session**: JWT exp + server-side existence check ✅
- **V4 Access Control**: role middleware on all admin routes ✅
- **V5 Validation/Sanitisation**: Joi + mongo-sanitize + xss-clean ✅
- **V7 Error Handling**: generic error messages, no stack in prod ✅
- **V9 Communications**: TLS expected at edge (document in deployment) ⚠️
- **V12 Files**: MIME + size limits, cloud storage ✅
- **V14 Config**: secrets only in env, gitignored, Docker non-root ✅

## 4. Recommended pre-production checklist

1. Rotate `JWT_SECRET`, `ADMIN_PASSWORD`, all SMTP/Cloudinary creds.
2. Set `NODE_ENV=production` and a real `CLIENT_ORIGIN` allow-list.
3. Run `npm audit --omit=dev --audit-level=high` → must pass.
4. Enable MongoDB auth + IP allow-list + encryption at rest.
5. Put API behind TLS-terminating proxy (NGINX/Cloud LB) and enable HSTS.
6. Enable Cloudinary signed URLs for attendance photos.
7. Add monitoring: `/api/health` alerting, log aggregation (Loki/ELK).
8. Add the Todo items above (face verification enforcement, audit log, email verification).
