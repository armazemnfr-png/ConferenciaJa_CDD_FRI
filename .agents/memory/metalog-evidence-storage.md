---
name: METALOG evidence storage
description: Attachments for METALOG are persisted in the active application database and served separately from the list response.
---

The active app connection may differ from the default Drizzle CLI connection; schema changes must be applied to the same database used by `server/db.ts`, and destructive schema prompts must not be confirmed when legacy columns are outside the current schema.

**Why:** The METALOG evidence feature initially synchronized against the wrong database and the schema diff also detected historical columns that would have been removed.

**How to apply:** For future METALOG schema changes, verify the app's active connection, add only the required non-destructive columns, keep file contents out of list responses, and apply the production schema through the publish flow.