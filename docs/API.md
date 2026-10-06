# USAS UMC API Reference

> **Unofficial.** These endpoints were reverse-engineered from the official
> USAS Mobile Campus (UMC) student app (v2.0.3). They are not documented or
> supported by the university and may change at any time. The daily schema
> monitor (`scripts/check-usas-schema.mjs`) exists to detect such changes.

## Transport

- **Origin**: `https://mobile.usas.edu.my/umc_v2`
- **Proxy**: the browser calls `/api/usas/<path>`; the Cloudflare Pages Function
  forwards to `<origin><path>`. Only allowlisted paths in
  `src/shared/lib/usasProxy.ts` are permitted.
- **Method**: `POST` only, JSON body (a form-urlencoded retry is attempted as a
  fallback).

### Global base payload

Most authenticated endpoints require:

```json
{
  "apiKey": "123",
  "token": "dummytoken",
  "umc_platform": "Android",
  "umc_version": "2.0.3",
  "user_id": "<MATRIC>",
  "sid_1": "<SESSION_1>",
  "sid_2": "<SESSION_2>",
  "sid_3": "<SESSION_3>"
}
```

---

## Endpoints

### 1. Login — `/student/login_student.php`

Request:

```json
{
  "request_type": "login",
  "user_id": "<MATRIC>",
  "password": "<PASSWORD>",
  "umc_version": "2.0.3",
  "platform": "Android"
}
```

Response:

```json
{
  "server_response": [
    { "status": 1, "message": "Login successful.", "sid_1": "...", "sid_2": "...", "sid_3": "..." }
  ]
}
```

`status` is `1` on success (number or string), otherwise `0`.

### 2. Student profile — `/student/get_student_profile.php`

Request: base payload with `request_type: "student_profile"`.

Response keys: `server_response_profil`, `server_response_akademik`,
`server_response_waris`, `server_response_kew`, `server_response_dp`.

### 3. Timetable — `/student/get_timetable_stud.php`

Request: base payload with `request_type: "jadual_kuliah"`.

Response:

```json
{
  "server_response": [
    {
      "day": "06-10-2026 (SELASA)",
      "date_time_start": "2026-10-06 11:00:00",
      "start_time": "11:00AM",
      "end_time": "1:00PM",
      "location": "BK B4",
      "course_id": "RKS6083",
      "course_name": "COMPUTER FORENSIC",
      "lecturer": "HELMY HANYFF BIN HAIRUDIN RUZAILI",
      "group": "G01",
      "kehadiran": "-",
      "catatan": "-"
    }
  ],
  "server_response_day": ["06-10-2026 (SELASA)", "07-10-2026 (RABU)"]
}
```

### 4. Attendance — `/student/get_kehadiran_kuliah.php`

**A. Enrolled courses** — `request_type: "senarai_kursus"`:

```json
{
  "server_response": [
    {
      "id": 1,
      "kod_kursus": "RKS6093",
      "kursus": "PENETRATION TESTING AND ETHICAL HACKING",
      "course_id": 1525,
      "pensyarah": "TS. AZIZI BIN AHMAD",
      "kumpulan": "G01",
      "jadual": "ISNIN<br>11:00 AM HINGGA 1:00 PM<br>MAKMAL KOMPUTER 2",
      "group_id": 126175,
      "semester": "SEMESTER I SESI 2026/2027",
      "pelajar": "RADZI BIN ZAMRI",
      "matrik": "I24107504"
    }
  ]
}
```

**B. Attendance report** — `request_type: "laporan_kehadiran"` with `group_id`:

```json
{
  "server_response": [
    { "minggu": "1", "tarikh": "10-Oct-2024", "status_hadir": "Hadir", "catatan": "" }
  ]
}
```

> Field names differ between endpoints: the timetable uses
> `course_id`/`course_name`/`lecturer`, while `senarai_kursus` uses
> `kod_kursus`/`kursus`/`pensyarah`. The client normalises both.

### 5. Attendance QR — `/student/get_scan_qr_v2.php`

Request: base payload with `request_type: "scan_qr"` and the scanned value.

### 6. Staff directory — `/student/get_directory_staff_v2.php`

Request:

```json
{ "request_type": "search_dir", "keyword": "HELMY HANYFF" }
```

Response:

```json
{
  "server_response_directory": [
    { "id": 1, "nama": "<b>HELMY HANYFF BIN HAIRUDIN RUZAILI</b>", "jawatan": "PENSYARAH", "ext": "-", "email": "helmyhanyff@usas.edu.my", "no_staff": "PSH265" }
  ]
}
```

`request_type` also supports `"dept_fac"` (faculties/departments) and
`"directory"` (staff by `dept_id`/`fac_id`).

---

## Field normalisation

`src/services/usas/Api.ts` maps the raw fields into the app's `TimetableItem`
type via `sanitizeTimetableItem`, accepting alternate keys where they exist
(e.g. `course_id`/`kod_kursus`, `lecturer`/`pensyarah`). If the upstream API
renames a field, update the mapping in that single file.
