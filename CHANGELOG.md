# Changelog

All notable changes to this project (developed by the USAS STEM Club) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
* Full 4-language support for English (default), Bahasa Melayu, Simplified Chinese (zh), and Tamil (ta).
* Custom glassmorphic language selection dropdown in top navigation.
* Five distinct timetable themes (Dark, Light, OLED, Emerald, and Warm Amber).
* Cloudflare Turnstile Captcha integration on login form.
* Server-side Cloudflare Turnstile verification on login (token checked in the Pages Function).
* Cloudflare Pages Function proxy for the USAS API (`/api/usas/*`).
* Lecturer directory lookup — official e-mail, position and extension fetched on demand.
* Best-effort per-IP rate limiting and structured logging in the API proxy.
* Optional Sentry client error tracking (`VITE_SENTRY_DSN`).
* Complete project documentation suite following open-source repository standards.

### Fixed
* Fixed export progress overlay hang after file generation.
* Eliminated sub-pixel typography vibration and jitter on 3D card tilt unfocus.
* Eliminated landing page flash during authenticated page reload.
* Resolved subject code resolution fallbacks between kod_kursus and course_id.
* Updated Playwright e2e test locators for multi-language compatibility.
* Prayer reminder chime no longer replays on every page refresh (notified state is persisted).
* Resolved all ESLint warnings across the repository.

### Changed
* Refactored top navigation with custom language dropdown selector.
* Standardized theme name to Dark Theme without Navy suffix.
* Upgraded standalone error pages (404, 500, 502, 503, 504) with dark glassmorphic styling and USAS emblem.
* Locked browser tab header strictly to USAS Class Timetable.
* Removed fabricated placeholder data shown to real accounts (faculty, venues, groups, attendance week numbers); values now come from the API or display as unknown.
* Attendance history no longer falls back to a default group when the real group ID is missing.
* Ongoing/upcoming class status now uses a coloured dot indicator instead of a card border ring.
* Removed dead code and the unused `workbox-window` dependency.
