---
skill_name: Filesystem Triage
version: 1.0.0
trigger: New file detected in /Drop_Folder or /Needs_Action
author: Muhammad Hassaan Aslam
last_updated: 2026-02-22
---

# Skill: Filesystem Triage

## Purpose

Automatically classify, prioritize, and route files that enter the vault through Drop_Folder or Needs_Action. Ensures no file is lost, every file is logged, and action plans are created.

## Trigger Conditions

1. filesystem_watcher.py detects a new file in /Drop_Folder/
2. A metadata .md file appears in /Needs_Action/
3. The orchestrator runs a scheduled scan cycle
4. A human manually places a file in /Inbox/

## Classification by File Extension

| Extension | Category | Priority |
|-----------|----------|----------|
| .pdf | Document | Normal |
| .txt | Note | Normal |
| .csv | Data | High |
| .xlsx | Spreadsheet | High |
| .docx | Document | Normal |
| .json | Config | High |
| .py | Code | Normal |
| .zip | Archive | Normal |
| Unknown | Unclassified | Low |

## Classification by Filename Keywords

| Keyword | Category | Priority |
|---------|----------|----------|
| invoice, bill, payment | Financial | High |
| contract, agreement, nda | Legal | Critical |
| urgent, asap, critical | Escalation | Critical |
| draft, wip | Work in Progress | Low |
| client, project | Client Work | High |

## Processing Steps

Step 1 — Detection and Logging
- Log detection event to /Logs/YYYY-MM-DD.json
- Record: filename, size, extension, timestamp, source folder

Step 2 — Classification
- Determine category from extension table
- Check filename for priority keywords
- Assign final priority: Critical > High > Normal > Low

Step 3 — Metadata Generation
Create metadata .md file in /Needs_Action/ with:
- type: file_drop
- original_name
- detected_at
- file_size
- category
- priority
- status: pending

Step 4 — Plan Creation
- Create Plan file in /Plans/
- Include: created date, status pending, source file, priority
- Include Objective section
- Include Steps with checkboxes
- If Critical or High priority — also create approval request in /Pending_Approval/

Step 5 — Dashboard Update
- Increment Pending Actions count
- Add timestamped entry to Recent Activity
- Update Last Check timestamp

Step 6 — Routing
- Normal/Low → stays in /Needs_Action/ for batch processing
- High → Plan created immediately
- Critical → Plan + approval request in /Pending_Approval/
- Financial → also logged in /Accounting/

## Security Checks

- .exe .bat .cmd .ps1 files: NEVER auto-process — move to /Pending_Approval/ with security warning
- Files with no extension: flag as suspicious, require human review
- Files over 100MB: do not copy, create reference note only
- Files containing keywords password, secret, key, token: flag for security review

## Error Handling

| Error | Response |
|-------|----------|
| File locked | Wait 3 seconds, retry once, if still locked log and skip |
| File vanished | Log as file_vanished, do not create plan |
| Duplicate filename | Append timestamp to avoid overwrite |
| Disk space low | Alert Dashboard, stop copying, notify human |