\# AI Employee Vault — Bronze Tier



\*\*Personal AI Employee Hackathon 0\*\* submission by Hassaan (fisky@HassaanHP)



\## What This Is



A local-first AI Employee system using:

\- \*\*Claude Code\*\* (reasoning engine)

\- \*\*Obsidian\*\* (knowledge base \& dashboard)

\- \*\*Python Watchers\*\* (file system monitoring)

\- \*\*Agent Skills\*\* (task automation)



\## Bronze Tier Requirements — ✅ Complete



\- \[x] Obsidian vault with Dashboard.md and Company\_Handbook.md

\- \[x] One working Watcher script (file system monitoring)

\- \[x] Claude Code successfully reading from and writing to the vault

\- \[x] Basic folder structure: /Inbox, /Needs\_Action, /Done, /Plans, /Logs

\- \[x] All AI functionality implemented as Agent Skills



\## How to Run



\### Prerequisites

\- Python 3.13+

\- Node.js 24+

\- Claude Code installed (`npm install -g @anthropic-ai/claude-code`)

\- Obsidian installed



\### Setup

1\. Clone this repo: `git clone https://github.com/YOUR\_USERNAME/AI\_Employee\_Vault.git`

2\. Open `C:\\AI\_Employee\_Vault` in Obsidian as a vault

3\. Navigate to `Scripts/ai\_employee`

4\. Install dependencies: `py -3.13 -m uv sync`



\### Run the Watcher

```bash

cd C:\\AI\_Employee\_Vault\\Scripts\\ai\_employee

py -3.13 -m uv run python filesystem\_watcher.py

