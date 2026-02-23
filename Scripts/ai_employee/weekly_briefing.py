"""
Weekly Briefing Generator - Gold Tier
Author: Muhammad Hassaan Aslam
GIAIC Hackathon 0
"""

import json
from pathlib import Path
from datetime import datetime

VAULT_PATH = Path(r"C:\AI_Employee_Vault")
BRIEFINGS = VAULT_PATH / "Briefings"
LOGS_FOLDER = VAULT_PATH / "Logs"
BRIEFINGS.mkdir(exist_ok=True)

def generate_briefing():
    today = datetime.now().strftime("%Y-%m-%d")
    logs = []
    for log_file in sorted(LOGS_FOLDER.glob("*.json"))[-7:]:
        try:
            entries = json.loads(log_file.read_text(encoding="utf-8"))
            logs.extend(entries)
        except Exception:
            pass

    done_files = list((VAULT_PATH / "Done").glob("*.md"))
    pending = list((VAULT_PATH / "Needs_Action").glob("*.md"))
    approvals = list((VAULT_PATH / "Pending_Approval").glob("*.md"))

    briefing = f"""---
generated: {today}
type: weekly_briefing
author: AI Employee
---

# Weekly CEO Briefing — {today}

## Executive Summary
Your AI Employee completed its weekly scan. Here is your business intelligence report.

## Operations This Week

| Metric | Count |
|--------|-------|
| Tasks Completed | {len(done_files)} |
| Pending Actions | {len(pending)} |
| Awaiting Approval | {len(approvals)} |
| Log Entries | {len(logs)} |

## Completed Items
{"".join(f"- {f.name}{chr(10)}" for f in done_files[-10:]) or "- None this week"}

## Pending Items
{"".join(f"- {f.name}{chr(10)}" for f in pending) or "- Inbox clear"}

## Approvals Required
{"".join(f"- {f.name}{chr(10)}" for f in approvals) or "- None"}

## Recommendations
- Review completed items in /Done folder
- Check /Pending_Approval if any approvals needed
- System is operating at Bronze + Silver + Gold tier

## Next Week Priorities
- Continue monitoring Gmail inbox
- Process any new file drops promptly
- Review business goals progress

---
*Generated automatically by AI Employee — Muhammad Hassaan Aslam, Karachi*
"""

    path = BRIEFINGS / f"Briefing_{today}.md"
    path.write_text(briefing, encoding="utf-8")
    print(f"Briefing created: {path}")

if __name__ == "__main__":
    generate_briefing()
