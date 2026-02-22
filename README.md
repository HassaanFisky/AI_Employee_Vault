# AI Employee Vault — Personal AI Operations System

GIAIC Hackathon 0 Submission | Bronze Tier | Muhammad Hassaan Aslam | Karachi, Pakistan

## Overview

AI Employee Vault is a local-first Personal AI Employee system that automates daily business operations for AI freelance consultants. Built for Muhammad Hassaan Aslam — AI Freelance Consultant and Tech Solutions Provider in Karachi, Pakistan.

This system handles:
- Automated file intake and triage via filesystem monitoring
- Intelligent task planning via Claude Code integration
- Business dashboard via Obsidian markdown vault
- Complete audit logging for operational transparency
- Human-in-the-loop approval for sensitive actions

## Architecture

Input Sources → Watcher (Python) → Obsidian Vault → Claude Code → Actions
                                         |
                              Dashboard.md (single source of truth)
                              Company_Handbook.md (operating rules)
                              Business_Goals.md (strategic alignment)
                              CLAUDE.md (AI employee instructions)

## Features — Bronze Tier Complete

| Feature | Status | Description |
|---------|--------|-------------|
| Obsidian Vault | Done | Structured knowledge base with operational folders |
| Dashboard.md | Done | Real-time system status and activity log |
| Company Handbook | Done | 7 rule categories governing AI behavior |
| Business Goals | Done | Q1 2026 targets with alert thresholds |
| CLAUDE.md | Done | Complete AI employee operating manual |
| File System Watcher | Done | Python watchdog-based Drop_Folder monitor |
| Orchestrator | Done | Automated Claude Code trigger on new items |
| Agent Skills | Done | 4 skill files in .claude/skills/ |
| Claude Code Integration | Done | Reads vault, creates plans, updates dashboard |
| Human-in-the-Loop | Done | Pending_Approval to Approved to Rejected flow |
| Audit Logging | Done | JSON daily logs plus watcher logs |
| Git Version Control | Done | Full repo with .gitignore for security |
| DRY_RUN Mode | Done | Safe development mode — no real external actions |
| Test Suite | Done | Automated tests for watcher functionality |

## Folder Structure

C:\AI_Employee_Vault\
|
|-- CLAUDE.md                    (AI Employee operating manual)
|-- Dashboard.md                 (System status and metrics)
|-- Company_Handbook.md          (Business rules and policies)
|-- Business_Goals.md            (Strategic objectives)
|-- README.md                    (This file)
|-- .gitignore                   (Security exclusions)
|
|-- .claude\
|   |-- CLAUDE.md                (Claude Code instructions)
|   |-- skills\
|       |-- filesystem_triage.md
|       |-- process_files.md
|       |-- update_dashboard.md
|       |-- weekly_briefing.md
|
|-- Inbox\
|-- Drop_Folder\                 (Drop files here to trigger watcher)
|-- Needs_Action\
|-- Plans\
|-- Pending_Approval\
|-- Approved\
|-- Rejected\
|-- Done\
|-- Logs\
|-- Accounting\
|-- Briefings\
|-- Active_Project\
|
|-- Scripts\
    |-- ai_employee\
        |-- filesystem_watcher.py
        |-- orchestrator.py
        |-- test_watcher.py
        |-- pyproject.toml
        |-- uv.lock

## Installation

Step 1 — Clone the repository
git clone https://github.com/HassaanFisky/AI_Employee_Vault.git
cd AI_Employee_Vault

Step 2 — Install Python dependencies
cd Scripts/ai_employee
py -3.13 -m uv sync

Step 3 — Open vault in Obsidian
File → Open folder as vault → select AI_Employee_Vault

Step 4 — Authenticate Claude Code
cd C:\AI_Employee_Vault
claude

## Usage

Start File System Watcher:
cd C:\AI_Employee_Vault\Scripts\ai_employee
py -3.13 -m uv run python filesystem_watcher.py

Run Orchestrator:
py -3.13 -m uv run python orchestrator.py

Run Tests:
py -3.13 -m uv run python test_watcher.py

Interactive Claude Code Session:
cd C:\AI_Employee_Vault
claude

## Security

| Measure | Implementation |
|---------|---------------|
| Credential Protection | .gitignore excludes .env, *.key, *.pem, credentials.json |
| DRY_RUN Mode | All external actions disabled during development |
| Human-in-the-Loop | Sensitive actions require approval flow |
| Audit Trail | Every action logged with timestamp, actor, result |
| No Hardcoded Secrets | All credentials via environment variables |
| Executable Blocking | .exe and .bat files flagged for security review |

## Hackathon Compliance — Bronze Tier

| Requirement | Status |
|-------------|--------|
| Obsidian vault with Dashboard.md | Complete |
| Company_Handbook.md with rules | Complete |
| One working Watcher script | Complete |
| Claude Code reads and writes vault | Complete |
| Basic folder structure | Complete |
| Agent Skills in .claude/skills/ | Complete |
| CLAUDE.md at vault root | Complete |
| GitHub repository | Complete |
| Test suite | Complete |

## Judging Criteria

| Criteria | Weight | How Addressed |
|----------|--------|---------------|
| Functionality | 30% | Working watcher, orchestrator, Claude integration, dashboard updates |
| Innovation | 25% | Vault-as-brain architecture, skill-based AI, automated triage |
| Practicality | 20% | Real freelancer workflow — file intake, task planning, client tracking |
| Security | 15% | DRY_RUN, HITL approval, .gitignore, no hardcoded secrets, audit logs |
| Documentation | 10% | CLAUDE.md, README.md, Company Handbook, test suite, inline comments |

## Author

Muhammad Hassaan Aslam
AI Freelance Consultant and Tech Solutions Provider
Karachi, Pakistan
GitHub: https://github.com/HassaanFisky
Hackathon: GIAIC Hackathon 0 — Personal AI Employee