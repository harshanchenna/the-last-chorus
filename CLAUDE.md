# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Read AGENTS.md first

This project's operating manual is **[`AGENTS.md`](./AGENTS.md)** — the canonical, tool-agnostic guide
(shared by Claude Code, Codex, and any other agent). It covers setup, commands, architecture, the core
rules, the five pillars, the iteration protocol, and git conventions. **Read it before making changes.**

Everything below is a Claude Code quick reference; `AGENTS.md` is the source of truth if they ever
disagree.

## TL;DR

- **What:** The Last Chorus — a data-driven 2D top-down action-adventure (Phaser 3 + TS + Vite) where
  "the world is a song." Self-iterating project; work in vertical slices, stay playable.
- **Before committing, all must be green:** `npm test && npm run build && npm run lint`, and
  `npm run dev` must boot cleanly.
- **Content lives in `src/data/*`** (data over code). **Feel/audio/save logic is pure and tested**
  (`systems/movement.ts`, `systems/AudioDirector.ts`, `core/SaveSystem.ts`) — keep Phaser at the edges.
- **Assets are placeholder-first** via `assets/manifest.ts`; real art swaps in with zero gameplay-code
  changes.
- **Each cycle:** pull from `TODO.md` → implement → verify → update `ITERATION_LOG.md` + affected docs
  in the same commit → commit + push.

## Project memory (read each cycle)

`brief/` (founding seed prompt + asset spec) · `AGENTS.md` (rules) · `ITERATION_LOG.md` (history) ·
`TODO.md` (backlog) · `DESIGN.md` (world bible) · `ARCHITECTURE.md` (why the code is shaped this way) ·
`ASSETS.md` (asset contract).

## This session's branch

`claude/project-init-6u7x3k` — commit often, push after each cycle.
