---
name: Adherence per-room matrícula resolution
description: Why per-room adherence counts must use the same resolved registration for both driver name and room lookup
---

In `getAdherenceReport` (server/storage.ts), when a conference's `driverId` is missing or literally "N/A", the code falls back to the Promax PW registration to resolve the driver's name. The room (sala) lookup must use that SAME resolved registration — not the original `driverId` — otherwise rows with "N/A" driverId get a resolved name but a null room, undercounting per-room adherence totals (Corona/Stella/Freteiro).

**Why:** `ginfo_checklist.equipe` looked like a plausible alternative per-map room source but is NOT reliable — it's often stale/missing for the current day's WMS map range. `driver_base.room` (joined via resolved registration) is the correct source of truth for room assignment.

**How to apply:** Any time driver identity is resolved via a fallback chain (conference driverId → Promax registration), propagate the final resolved registration to ALL downstream lookups (name, room, etc.), not just the one that triggered the fallback.
