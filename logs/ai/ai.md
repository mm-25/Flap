<!-- CONTEXT_BLOCK -->
# AI — Flap
Project Type: dev
Last Updated: [Thu 2026-06-04 23:55]

## CURRENT STATE
Active instructions:
- [ACTIVE] Run app with `npm run tauri dev` from `flap/` dir; requires `source ~/.cargo/env` first.
- [ACTIVE] Distributable build = `npm run tauri build` → bundle path. The bundle does NOT auto-install. After every release build, copy `src-tauri/target/release/bundle/macos/Flap.app` to `/Applications/Flap.app` so the user actually runs the new code (they double-click /Applications/Flap.app).
- [ACTIVE] When shipping a feature: build, install to /Applications, update README + logs, commit + push, then summarize.
- [ACTIVE] Don't claim a bug is fixed without a live verification, OR explicitly flag that it couldn't be verified and why.
- [ACTIVE] Don't leave debug scaffolding (console pipes, on-screen overlays, alert spam) in committed code.
- [SUPERSEDED] Caveman mode: terse responses. (User reverted to normal prose mid-project.)
- [SUPERSEDED] No changes to useFileTree layout logic. (Now intentionally extended with refreshFolder, collapseAll, revealPath; layoutTree itself remains stable.)

<!-- END CONTEXT_BLOCK -->

---

## CHANGE LOG

### [Wed 2026-06-03 00:00]
**Type:** instruction
**Summary:** AI log initialized; active instructions captured.
**Detail:**
User activated caveman mode for this session. Project run command confirmed. Constraint: breadcrumb impl should not touch useFileTree or layout logic — purely a nav layer reading existing state.
**Impact:** Governs AI behavior for remainder of project.

### [Thu 2026-06-04 23:55]
**Type:** instruction
**Summary:** Refreshed AI directives — install-to-/Applications, verify-before-claim, no debug scaffolding.
**Detail:**
Past few sessions surfaced concrete behavioural rules. (1) `tauri build` outputs to the bundle dir; the user runs `/Applications/Flap.app`. Forgetting to copy = user runs stale code. So: every release build is followed by `cp -R ... /Applications/Flap.app`. (2) Several bugs were "fixed" without verification and persisted; commit to verifying live OR clearly flagging when verification couldn't happen. (3) Debug overlays / console pipes leaked into commits; always strip before committing. (4) Caveman mode and the useFileTree-immutability rule from baseline are no longer in effect — superseded.
**Impact:** Codifies what was learned the hard way so future agents skip the same mistakes.
