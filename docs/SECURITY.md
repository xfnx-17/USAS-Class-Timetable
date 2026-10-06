# Security Policy

## Supported Versions

Currently, only the latest release of USAS Class Timetable is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

---

## Client-Side Security Architecture

USAS Class Timetable operates on a strict zero-knowledge, client-side architecture:

* **Zero Intermediate Servers**: All communication is conducted directly between the client browser and the official university portal endpoints (`https://mobile.usas.edu.my`).
* **No Database Storage**: No credentials, passwords, or student identities are ever saved to external database servers.
* **Content Security Policy (CSP)**: Strict CSP rules are enforced preventing XSS and frame injection attacks.

---

## Reporting a Vulnerability

If you discover a security vulnerability within USAS Class Timetable, please report it directly to the USAS STEM Club. All security vulnerabilities will be promptly addressed.

Please do not publicly disclose the issue until it has been addressed by the maintainers. We will work with you to ensure a timely resolution.
