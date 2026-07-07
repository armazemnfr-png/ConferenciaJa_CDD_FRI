---
name: Promax driver lookup
description: How to correctly map promax data to driver names in adherence/TML reports
---

The `promax_data.motorista` field stores the driver **registration number** (matrícula), NOT the driver name. Examples: "313", "8", "00646".

**Why:** The Promax PW CSV "Motorista" column contains the registration number assigned in the logistics system. The actual name is only in `driver_base`.

**How to apply:**
1. Fetch promax rows with `fase = 'CARREGADO'` to get mapa → registration mapping
2. Use `normalizeReg(registration)` to strip leading zeros: "00646" → "646"
3. Look up name in `driver_base` via `nameByReg.get(normalizeReg(promaxReg))`
4. If name not found, still set `driverId = promaxReg` so the registration shows in the UI

The `normalizeReg` function does `parseInt(s, 10).toString()` to strip leading zeros.
