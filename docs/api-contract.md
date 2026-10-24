# API contract (recovered from CS Attendance System app v1.4.4)

Base: `https://api-lms.iotpro.uk/v1`. JSON in/out. Header `x-client-platform: android`.
Auth: `Authorization: Bearer <accessToken>`; on 401 `POST /auth/refresh {refreshToken}` -> `{accessToken, refreshToken}` (single-flight, then retry once). A 401 from refresh ends the session.
Errors: `{message: string | [{message}]}`.

| Endpoint | Notes |
|---|---|
| `POST /auth/login` | `{email, password, turnstileToken}` -> `{accessToken, refreshToken}`. Token comes from a Cloudflare Turnstile widget (site key `0x4AAAAAAEhEMJOtdRlES950`, WebView base URL `https://iotpro.uk`). Error codes: user_not_found, invalid_password, account_deactivated, captcha_failed |
| `POST /auth/logout` | `{refreshToken}` |
| `POST /auth/forgot-password` | `{email}` |
| `POST /auth/change-password` | auth, `{currentPassword, newPassword}` |
| `GET /user/me` | user profile |
| `GET /enrollments/me` | enrollments with `section.course`, `section.instructor` |
| `GET /attendance/section/{id}` | lecture instances: `lectureDate, startTime, endTime, cancelled, attendanceMarked, presentStudentIds[]` |
| `GET /assessments/sections/{id}/my-performance` | marks per assessment |
| `GET /timetable` | `{monday: [...], ...}` |
| `GET /notices?limit&offset`, `GET /notices/{id}` | `{notices, hasMore}` |
| `GET /enrollments/me/transcript` | `{semesters[], cgpa, totalCreditHours}` |

Attendance rule (as in the original): a marked lecture is *present* if the student id is in `presentStudentIds`, else *absent*; cancelled lectures are ignored; percent = present / (present + absent). Warning threshold in the original: 75%.

Not reimplemented: surveys, TA tools, course enrollment/browse, academic calendar, push notifications, biometric login, GPS attendance marking.
