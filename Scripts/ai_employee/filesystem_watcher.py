import time
import shutil
import logging
import json
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

VAULT_PATH = Path(r"C:\AI_Employee_Vault")
DROP_FOLDER = VAULT_PATH / "Drop_Folder"
NEEDS_ACTION = VAULT_PATH / "Needs_Action"
LOGS_FOLDER = VAULT_PATH / "Logs"

DROP_FOLDER.mkdir(parents=True, exist_ok=True)
NEEDS_ACTION.mkdir(parents=True, exist_ok=True)
LOGS_FOLDER.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOGS_FOLDER / "filesystem_watcher.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("FileSystemWatcher")


def log_action(action_type, details):
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = LOGS_FOLDER / f"{today}.json"
    entry = {
        "timestamp": datetime.now().isoformat(),
        "action_type": action_type,
        "actor": "filesystem_watcher",
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


class DropFolderHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        source = Path(event.src_path)
        time.sleep(1)
        if source.name.startswith(".") or source.name.startswith("~"):
            return
        logger.info(f"New file detected: {source.name}")
        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe = source.name.replace(" ", "_")
            dest = NEEDS_ACTION / f"FILE_{ts}_{safe}"
            shutil.copy2(str(source), str(dest))
            meta = f"""---
type: file_drop
original_name: {source.name}
detected_at: {datetime.now().isoformat()}
file_size: {source.stat().st_size} bytes
status: pending
priority: normal
---

# New File Dropped for Processing

- **Original Name**: {source.name}
- **Size**: {source.stat().st_size} bytes
- **Detected At**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Suggested Actions
- [ ] Review file contents
- [ ] Categorize file
- [ ] Move to /Done when complete
"""
            meta_path = NEEDS_ACTION / f"FILE_{ts}_{source.stem}.md"
            meta_path.write_text(meta, encoding="utf-8")
            logger.info(f"Metadata created: {meta_path.name}")
            log_action("file_detected", {"original_name": source.name, "destination": str(dest)})
        except Exception as e:
            logger.error(f"Error processing {source.name}: {e}")


def main():
    logger.info("=" * 50)
    logger.info("AI Employee File System Watcher Starting...")
    logger.info(f"Watching: {DROP_FOLDER}")
    logger.info(f"Action folder: {NEEDS_ACTION}")
    logger.info("Drop any file into Drop_Folder to test.")
    logger.info("Press Ctrl+C to stop.")
    logger.info("=" * 50)
    handler = DropFolderHandler()
    observer = Observer()
    observer.schedule(handler, str(DROP_FOLDER), recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping watcher...")
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()