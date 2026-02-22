"""
Test Suite for AI Employee File System Watcher
Author: Muhammad Hassaan Aslam
Karachi, Pakistan — GIAIC Hackathon 0

Run with: py -3.13 -m uv run python test_watcher.py
"""

import sys
import json
import time
from pathlib import Path
from datetime import datetime

VAULT_PATH = Path(r"C:\AI_Employee_Vault")
DROP_FOLDER = VAULT_PATH / "Drop_Folder"
NEEDS_ACTION = VAULT_PATH / "Needs_Action"
LOGS_FOLDER = VAULT_PATH / "Logs"
DASHBOARD = VAULT_PATH / "Dashboard.md"

passed = 0
failed = 0
total = 0


def test(name, condition, detail=""):
    global passed, failed, total
    total += 1
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}" + (f" -- {detail}" if detail else ""))


def cleanup():
    for f in NEEDS_ACTION.glob("*test_watcher_simulation*"):
        try:
            f.unlink()
        except Exception:
            pass
    for f in DROP_FOLDER.glob("*test_watcher_simulation*"):
        try:
            f.unlink()
        except Exception:
            pass


print("=" * 60)
print("AI Employee Watcher — Test Suite")
print(f"Vault : {VAULT_PATH}")
print(f"Time  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 60)
print()

# Group 1: Folder Structure
print("--- Folder Structure ---")
test("Vault root exists", VAULT_PATH.exists())
test("Drop_Folder exists", DROP_FOLDER.exists())
test("Needs_Action exists", NEEDS_ACTION.exists())
test("Logs exists", LOGS_FOLDER.exists())
test("Done exists", (VAULT_PATH / "Done").exists())
test("Plans exists", (VAULT_PATH / "Plans").exists())
test("Inbox exists", (VAULT_PATH / "Inbox").exists())
test("Pending_Approval exists", (VAULT_PATH / "Pending_Approval").exists())
test("Approved exists", (VAULT_PATH / "Approved").exists())
test("Rejected exists", (VAULT_PATH / "Rejected").exists())
test("Accounting exists", (VAULT_PATH / "Accounting").exists())
test("Briefings exists", (VAULT_PATH / "Briefings").exists())
print()

# Group 2: Core Files
print("--- Core Files ---")
test("Dashboard.md exists", DASHBOARD.exists())
test("Company_Handbook.md exists", (VAULT_PATH / "Company_Handbook.md").exists())
test("Business_Goals.md exists", (VAULT_PATH / "Business_Goals.md").exists())
test("CLAUDE.md at vault root exists", (VAULT_PATH / "CLAUDE.md").exists(),
     "Create CLAUDE.md at C:\\AI_Employee_Vault\\CLAUDE.md")
test(".claude/CLAUDE.md exists", (VAULT_PATH / ".claude" / "CLAUDE.md").exists())
test("filesystem_watcher.py exists",
     (VAULT_PATH / "Scripts" / "ai_employee" / "filesystem_watcher.py").exists())
print()

# Group 3: Agent Skills
print("--- Agent Skills ---")
skills = VAULT_PATH / ".claude" / "skills"
test("Skills directory exists", skills.exists())
test("filesystem_triage.md exists", (skills / "filesystem_triage.md").exists())
test("process_files.md exists", (skills / "process_files.md").exists())
test("update_dashboard.md exists", (skills / "update_dashboard.md").exists())
test("weekly_briefing.md exists", (skills / "weekly_briefing.md").exists())
print()

# Group 4: Dashboard Content
print("--- Dashboard Content ---")
if DASHBOARD.exists():
    d = DASHBOARD.read_text(encoding="utf-8")
    test("Dashboard has YAML frontmatter", d.startswith("---"))
    test("Dashboard has System Status", "System Status" in d)
    test("Dashboard has Pending Actions", "Pending Actions" in d)
    test("Dashboard has Recent Activity", "Recent Activity" in d)
else:
    for i in range(4):
        test(f"Dashboard content {i+1}", False, "Dashboard.md missing")
print()

# Group 5: CLAUDE.md Content
print("--- CLAUDE.md Content ---")
claude_md = VAULT_PATH / "CLAUDE.md"
if claude_md.exists():
    c = claude_md.read_text(encoding="utf-8")
    test("CLAUDE.md has owner", "Muhammad Hassaan" in c or "owner" in c)
    test("CLAUDE.md has HITL rules", "Human-in-the-Loop" in c or "HITL" in c)
    test("CLAUDE.md has Security rules", "Security" in c)
    test("CLAUDE.md has Folder Reference", "Folder" in c)
else:
    for i in range(4):
        test(f"CLAUDE.md content {i+1}", False, "CLAUDE.md missing at vault root")
print()

# Group 6: Watcher Module
print("--- Watcher Module ---")
sys.path.insert(0, str(VAULT_PATH / "Scripts" / "ai_employee"))
try:
    from filesystem_watcher import log_action, DropFolderHandler
    test("Watcher module imports OK", True)

    log_action("test_suite_run", {"author": "Muhammad Hassaan Aslam", "test": "automated"})
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = LOGS_FOLDER / f"{today}.json"
    test("log_action creates daily log", log_file.exists())

    if log_file.exists():
        logs = json.loads(log_file.read_text(encoding="utf-8"))
        entries = [l for l in logs if l.get("action_type") == "test_suite_run"]
        test("log_action writes correct entry", len(entries) > 0)
    else:
        test("log_action writes correct entry", False, "Log file not found")

except ImportError as e:
    test("Watcher module imports OK", False, str(e))
    test("log_action creates daily log", False, "Import failed")
    test("log_action writes correct entry", False, "Import failed")
print()

# Group 7: File Drop Simulation
print("--- File Drop Simulation ---")
cleanup()
test_file = DROP_FOLDER / "test_watcher_simulation.txt"
test_file.write_text("Simulated invoice from Test Client PKR 15000", encoding="utf-8")
test("Test file created in Drop_Folder", test_file.exists())

try:
    from filesystem_watcher import DropFolderHandler

    class FakeEvent:
        def __init__(self, path):
            self.src_path = str(path)
            self.is_directory = False

    handler = DropFolderHandler()
    handler.on_created(FakeEvent(test_file))
    time.sleep(1)

    md_files = list(NEEDS_ACTION.glob("*test_watcher_simulation*.md"))
    test("Metadata .md created in Needs_Action", len(md_files) > 0)

    if md_files:
        meta = md_files[0].read_text(encoding="utf-8")
        test("Metadata has YAML frontmatter", meta.startswith("---"))
        test("Metadata has original_name", "test_watcher_simulation" in meta)
        test("Metadata has status field", "status:" in meta)
        test("Metadata has priority field", "priority:" in meta)
    else:
        for i in range(4):
            test(f"Metadata content {i+1}", False, "No metadata file found")

    copied = list(NEEDS_ACTION.glob("FILE_*test_watcher_simulation*"))
    test("Original file copied to Needs_Action", len(copied) > 0)

except Exception as e:
    test("File drop simulation", False, str(e))
    for i in range(5):
        test(f"Simulation sub-test {i+1}", False, "Simulation failed")
print()

# Group 8: Security
print("--- Security ---")
gi = VAULT_PATH / ".gitignore"
test(".gitignore exists", gi.exists())
if gi.exists():
    g = gi.read_text(encoding="utf-8")
    test(".gitignore blocks .env", ".env" in g)
    test(".gitignore blocks credentials", "credentials" in g or "token" in g)
    test(".gitignore blocks __pycache__", "__pycache__" in g)
    test(".gitignore blocks .venv", ".venv" in g or "venv" in g)
else:
    for i in range(4):
        test(f"Gitignore {i+1}", False, ".gitignore missing")
print()

# Cleanup and Results
cleanup()
print("=" * 60)
print(f"RESULT: {passed} passed / {total} total  |  {failed} failed")
print("=" * 60)

if failed == 0:
    print()
    print("ALL TESTS PASSED — Bronze Tier vault fully configured!")
    sys.exit(0)
else:
    print()
    print(f"Fix the {failed} failed test(s) above then re-run.")
    sys.exit(1)
