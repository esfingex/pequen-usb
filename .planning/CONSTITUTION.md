# Pequén USB - Constitution & Coding Standards

## 1. Modern Python Standard
- Target Python version is 3.10+.
- Use modern type annotations (`list[str] | None` instead of `Optional` / `Union`).
- Use `match/case` for pattern matching and branching.
- Use `pathlib.Path` exclusively for filesystem paths.

## 2. GNOME Shell Extension Standard
- Follow GNOME Shell 45+ ESM module syntax (`import Extension from 'resource:///org/gnome/shell/extensions/extension.js'`).
- Ensure metadata.json specifies support for GNOME Shell versions ["45", "46", "47", "48", "49", "50"].

## 3. Terminal Command Prefix Rule
- All terminal/shell operations MUST be executed using the `rtk` wrapper prefix (e.g. `rtk git status`, `rtk python3 -m pytest`).

## 4. Documentation Formatting
- Planning documents in `.planning/` MUST be plain text without emojis or icon symbols.
