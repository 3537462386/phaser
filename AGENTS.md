# Project Guidelines

See [README.md](README.md) for the full gameplay and module overview. Keep this file limited to repository-wide instructions that help coding agents act safely.

## First Read

- Read [README.md](README.md) before changing gameplay flow or manager responsibilities.
- For combat tuning, start with [src/constants.js](src/constants.js), [src/config/CombatConfig.js](src/config/CombatConfig.js), and [src/scenes/FightScene.js](src/scenes/FightScene.js).
- For character rendering or pose logic, start with [src/entities/Fighter.js](src/entities/Fighter.js).

## Runtime And Validation

- This project runs as browser-loaded scripts from [index.html](index.html); there is no bundler or module system.
- There is no build step and no automated test suite in the repo.
- Run the game through a local HTTP server, not `file://`. Use `python -m http.server 8080` or `npx serve .` from the repo root.
- Phaser is loaded from a CDN in [index.html](index.html), so offline validation can fail even when local code is correct.
- Spine runtime assets must keep the `.json`, `.atlas`, and texture files in sync when replaced.

## Architecture

- [index.html](index.html) script order is part of the runtime contract: config -> constants -> renderers -> entities -> managers -> scene -> main. Do not introduce imports/exports or reorder scripts unless you also update the loading model.
- [src/main.js](src/main.js) creates the Phaser game and boots `FightScene`.
- [src/renderers](src/renderers) contains the Spine fighter renderer and the renderer factory; extend Spine-facing helpers here instead of growing `FightScene`.
- [src/scenes/FightScene.js](src/scenes/FightScene.js) coordinates combat flow, hit checks, and manager collaboration.
- [src/managers](src/managers) contains the active input, UI, effects, and round managers.

## Project-Specific Conventions

- Treat [src/constants.js](src/constants.js) as the current aggregation point for gameplay constants, and update the dedicated files under [src/config](src/config) when they exist.
- [src/config/GameConfig.js](src/config/GameConfig.js) duplicates configuration but is not loaded by [index.html](index.html); do not update it unless you are intentionally consolidating config.
- Prefer the implementations under [src/managers](src/managers). [src/ui/UIManager.js](src/ui/UIManager.js) appears to be a stale duplicate, not the runtime path.
- Favor extracting repeated logic or single-responsibility behavior into dedicated files or helpers before growing large scene methods.
- Add concise comments for non-obvious control flow, state transitions, or data-driven behavior.
- Prefer named variables and config-driven data over hardcoded values so unfinished systems can expand without rewriting call sites.
- Keep gameplay values, input mappings, and render configuration in dedicated config files instead of scattering tunables across scenes and managers.
- When extending combat or rendering behavior, add or reuse stable Fighter-facing interfaces instead of directly growing `FightScene` switch blocks around specific body parts.
- Existing docs, comments, and most user-facing text are primarily Chinese; preserve established gameplay terms when editing content.
- Keep changes compatible with plain browser JavaScript and existing global names such as `GAME_CONFIG`, `ATTACK_TYPES`, and `FightScene`.
- Asset paths assume the repo root is the server root, for example `assets/spine/spineboy/spineboy-pro.json`.
