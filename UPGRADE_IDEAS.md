# Upgrade Ideas — Employee Attendance App

A prioritized list of enhancements to evolve this MVP into a production-grade HRM module.

## 1. Face recognition & anti-spoofing (P0)
- **Server-side face verification**: integrate AWS Rekognition `CompareFaces` or Azure Face API, so validation does not rely on the client sending a descriptor.
- **Liveness detection** to prevent photo-of-photo attacks: blink detection, head-turn challenge (MediaPipe Face Mesh or Rekognition Liveness).
- **Face enrolment flow** at first login (dedicated screen), not piggybacked on the first check-in.
- Automatic re-enrolment after N months to handle face drift.

## 2. Attendance UX (P0)
- Check-**out** support and total worked hours.
- Geo-fencing: only allow check-in within a configurable radius of office location.
- Offline mode: queue check-ins locally and sync when online.
- Manual attendance request with admin approval (for missed check-ins).
- Weekly / monthly CSV / PDF export from the Reports screen.

## 3. Admin & reporting (P1)
- Rich admin web dashboard (Next.js) for bulk operations and charts.
- Filters on reports: by employee, date range, status, location.
- Analytics dashboard: punctuality trends, absenteeism heatmap, monthly KPIs.
- Audit log for all admin actions (approve, reject, delete, edit holiday).
- Bulk CSV import for holidays and employees.

## 4. Notifications (P1)
- Push notifications (Expo Notifications) for:
  - Registration approved / rejected.
  - Check-in reminder at configured time.
  - Holiday / policy announcements from admin.
- In-app notification center.
- Slack / Teams webhook for daily attendance summary.

## 5. Security hardening (P1)
- **Secure storage for JWT** on device using `expo-secure-store`.
- **Refresh tokens** with rotation; short-lived access tokens (15 min).
- **TOTP 2FA** (admin at minimum) using `otplib`.
- Account lockout after N failed logins (persistent).
- Cloudinary **signed URLs** with short TTL for attendance photos.
- Email verification before admin sees the request.
- **PII encryption at rest** for mobile / email using AES-GCM + KMS.
- Secrets pulled from a secrets manager (AWS Secrets Manager, HashiCorp Vault).

## 6. Data & architecture (P2)
- Split services: auth-service, attendance-service, notification-service.
- Add Redis for rate-limit state, refresh-token denylist, and session caching.
- Queue (BullMQ) for email sending and face-recognition jobs.
- Soft delete for employees (retain attendance history).
- Time-zone-aware date storage; currently `YYYY-MM-DD` assumes server TZ.

## 7. Mobile app polish (P2)
- Dark mode (tokens are already centralised in `src/config.js`).
- Localisation (i18n-js + `Intl`): English, Hindi, Tamil, etc.
- Profile photo upload (Cloudinary).
- Biometric unlock for the app (Face ID / fingerprint via `expo-local-authentication`).
- Better error states, skeleton loaders, haptic feedback on successful check-in.

## 8. DevOps & quality (P1)
- Integration tests with `mongodb-memory-server`.
- E2E tests with Detox on a matrix of Android versions.
- Sentry / Datadog integration for crash + performance monitoring.
- Blue/green deploy to ECS/Fly.io/Render with health checks.
- Database migrations with `migrate-mongo`.
- Pre-commit hooks (`lint-staged`, `prettier`, `commitlint`).
- Load testing with `k6`.

## 9. Compliance (P2)
- GDPR: data export + delete-account endpoints for employees.
- Data retention policy (e.g. delete attendance photos after 90 days, keep metadata).
- Terms of Service / Privacy Policy screens in the app.
- Consent screens for camera, location, notifications with clear purpose strings.

## 10. Business features (P3)
- Leave management: apply / approve leaves, leave balance tied to attendance.
- Shifts & rosters with per-shift grace periods.
- Payroll export (hours × rate).
- Department / team hierarchy with team-level admins.
- Biometric kiosk mode (tablet at reception auto-checks-in employees).
- WhatsApp / SMS OTP login (Twilio / MSG91).

## 11. AI-assisted ideas (P3)
- "Suspicious attendance" detector: clusters of implausible check-in locations/times.
- Automated absenteeism summary email to HR every Monday.
- Personalised nudges: "You've been late 3 days this week — set a check-in reminder?"

## 12. Quick-win backlog (< 1 day each)
- Swipe-to-refresh on all lists ✅ already.
- Forgot-password flow (admin-assisted reset + email).
- `/api/version` endpoint returning the git SHA.
- Seed script for sample holidays.
- CLI command `node src/scripts/resetAdmin.js` to rotate admin creds.
- Dockerfile for MongoDB + docker-compose for a one-command dev bring-up.
