import subprocess
import time
import logging
import json
from pathlib import Path
from datetime import datetime

VAULT_PATH = Path(r"C:\AI_Employee_Vault")
NEEDS_ACTION = VAULT_PATH / "Needs_Action"
APPROVED = VAULT_PATH / "Approved"
DONE = VAULT_PATH / "Done"
LOGS_FOLDER = VAULT_PATH / "Logs"

CHECK_INTERVAL = 60

for folder in [NEEDS_ACTION, APPROVED, DONE, LOGS_FOLDER]:
    folder.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOGS_FOLDER / "orchestrator.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("Orchestrator")


def log_action(action_type, details):
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = LOGS_FOLDER / f"{today}.json"
    entry = {
        "timestamp": datetime.now().isoformat(),
        "action_type": action_type,
        "actor": "orchestrator",
        "details": details,
        "result": "success"
    }
    existing = []
    if log_file.exists():
        try:
            existing = json.loads(log_file.read_text(encoding="utf-8"))
        except Exception:
            existing = []
    existing.append(entry)
    log_file.write_text(json.dumps(existing, indent=2, default=str), encoding="utf-8")


def trigger_claude(prompt):
    logger.info("Triggering Claude Code...")
    try:
        result = subprocess.run(
            ["claude", "--print", prompt],
            capture_output=True,
            text=True,
            timeout=180,
            cwd=str(VAULT_PATH)
        )
        if result.returncode == 0:
            logger.info("Claude Code finished successfully")
            return result.stdout
        else:
            logger.error(f"Claude error: {result.stderr[:300]}")
            return f"ERROR: {result.stderr}"
    except subprocess.TimeoutExpired:
        logger.error("Claude timed out (180s)")
        return "ERROR: timeout"
    except FileNotFoundError:
        logger.error("claude not found. Run: npm install -g @anthropic-ai/claude-code")
        return "ERROR: claude not installed"
    except Exception as e:
        logger.error(f"Error: {e}")
        return f"ERROR: {e}"


def process_needs_action():
    items = list(NEEDS_ACTION.glob("*.md"))
    if not items:
        return
    logger.info(f"{len(items)} item(s) in Needs_Action")
    file_list = "\n".join(f"  - {i.name}" for i in items)
    prompt = (
        "You are an AI Employee. Your Obsidian vault is the current working directory.\n"
        "Read Company_Handbook.md for your rules.\n\n"
        f"These files are waiting in Needs_Action/:\n{file_list}\n\n"
        "For EACH file:\n"
        "1. Read the file.\n"
        "2. Create a Plan in Plans/ with YAML front-matter (created, status: pending), "
        "an Objective, and Steps with checkboxes.\n"
        "3. If the action needs human approval (payments, emails, deletions), "
        "create an approval file in Pending_Approval/.\n"
        "4. Move the original .md file from Needs_Action/ to Done/.\n"
        "5. Update Dashboard.md with pending count, recent-activity line, "
        "and last-check timestamp.\n\n"
        "Do it now."
    )
    response = trigger_claude(prompt)
    log_action("process_needs_action", {"items": len(items), "response_len": len(response)})


def process_approved():
    items = list(APPROVED.glob("*.md"))
    if not items:
        return
    logger.info(f"{len(items)} approved item(s)")
    for item in items:
        logger.info(f"[DRY RUN] Would execute: {item.name}")
        dest = DONE / item.name
        if dest.exists():
            dest = DONE / f"{item.stem}_{datetime.now().strftime('%H%M%S')}{item.suffix}"
        item.rename(dest)
        log_action("approved_processed", {"file": item.name, "mode": "dry_run"})


def main():
    logger.info("=" * 50)
    logger.info("AI Employee Orchestrator Starting")
    logger.info(f"Vault: {VAULT_PATH}")
    logger.info(f"Check interval: {CHECK_INTERVAL}s")
    logger.info("Press Ctrl+C to stop.")
    logger.info("=" * 50)
    cycle = 0
    try:
        while True:
            cycle += 1
            logger.info(f"--- Cycle {cycle} [{datetime.now().strftime('%H:%M:%S')}] ---")
            process_needs_action()
            process_approved()
            logger.info(f"Sleeping {CHECK_INTERVAL}s...")
            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        logger.info("Orchestrator stopped.")


if __name__ == "__main__":
    main()