# AGENT.md - Alicanto Workflow Integration for Pequén USB

This repository is integrated with the **Alicanto AI Tools** ecosystem.

## Mandatory Agent Workflow Rules

### 1. Planning Specification (`.planning/`)
Always reference and maintain the GSD planning files in `.planning/`:
- `PROJECT.md`: System architecture and folder layout
- `ROADMAP.md`: Project phases and checklists
- `STATE.md`: Active phase status and ADRs
- `CONSTITUTION.md`: Code quality, design, and terminal rules
- `CHECKLIST.md`: Verification points
- `continue-here.md`: Context handoff

### 2. Terminal Commands (`rtk`)
- ALL terminal/shell execution commands MUST be prefixed with `rtk` (e.g. `rtk git status`, `rtk python3 -m pytest`).

### 3. CaveMem Integration (Bilingual Caveman Format - BCF)
- Query CaveMem before starting complex tasks: `rtk cavemem query "<topic>"`
- Save solutions and gotchas in BCF: `cavemem add <category> "[EN] caveman notes... [ES] nota completa en español..." -t "pequen-usb,gnome"`

### 4. Supply-Chain & Package Safety Gate
- Check dependency legitimacy before installing: `rtk pip index versions <package>` / `rtk npm view <package>`.
