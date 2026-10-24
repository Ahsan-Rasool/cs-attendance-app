# CS Attendance Plus

An unofficial, student-focused client for the CS Attendance System, rebuilt from the published v1.4.4 Android app (React Native/Hermes) because the original source was unavailable. It talks to the same backend; see `docs/api-contract.md`.

**New client-side features:** light/dark/system theme, redesigned dashboard, per-course bars, per-course what-if planners, my own timetable classes, PDF export of timetable and attendance, attendance calendars, configurable minimum %, GPA graph, offline cache of last-seen data, demo mode.

## Status / limits
- Built and type-checked, logic unit-tested (`npm test`), and rendered in a browser in demo mode. **It has not been run against the live server** (not reachable from the build sandbox), so response shapes were inferred from the decompiled app and first sign-in may reveal small field mismatches.
- Package id is `lms.iotpro.plus`, so it installs beside the original app. Push notifications and GPS-based marking are intentionally not included.

## Build
`npm ci && npm start` for development. An APK (signed with the standard debug key) is built by the *Build Android APK* GitHub Action; download it from the run's artifacts.
