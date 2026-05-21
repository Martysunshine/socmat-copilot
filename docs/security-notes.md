# Security Notes — File Handling

## Uploaded Files Are Never Executed

SOC Copilot Workbench treats all uploaded evidence as untrusted input.
Files are stored on disk and read for metadata and content analysis only.
No uploaded file is ever executed, interpreted, or run as a script.

## Safe Filename Handling

Before storing an uploaded file, the backend:

1. Strips any directory components from the filename (`Path(name).name`)
2. Replaces all characters that are not word characters, hyphens, or dots with underscores
3. Strips leading dots to prevent hidden files
4. Prepends a UUID prefix to the stored filename so no two uploads can collide or overwrite each other

The original filename is stored separately in the database for display purposes only.

## Upload Storage

Uploaded files are stored in `services/api/uploads/` on the local filesystem.
This directory is created automatically on first use and is excluded from git via `.gitignore`.

## SHA-256 Integrity

A SHA-256 hash is calculated for every uploaded file immediately after upload.
This hash is stored in the database and displayed in the UI so analysts can verify file integrity and cross-reference hashes against threat intelligence.

## File Size

There is no hard file size limit enforced in the MVP.
For a production deployment, an upload size limit should be enforced at the reverse proxy layer (e.g., nginx `client_max_body_size`).

## What Not to Upload

- Do not upload live malware outside of an isolated lab environment.
- Do not upload files containing real credentials, PII, or sensitive production data.
- This tool is intended for analysis of sample or captured evidence only.

## CORS

The API only accepts requests from `http://localhost:5173` and `http://127.0.0.1:5173`.
Do not expose this service on a public network without additional authentication and hardening.
