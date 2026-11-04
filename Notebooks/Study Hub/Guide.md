---
layout: note
study_hub: true
title: Using your Study Hub
category: Study Hub / guide
permalink: /study/guide/
---

## Capture a discovery

Open the current note in **Study Hub/Weeks** and add a row to its **Discoveries** table. Each question is a row, not a separate file. Existing notebook notes hold detailed explanations, code, and diagrams.

| Column | What to enter |
| --- | --- |
| Question / topic | A short question or topic. This is the only required value in a row. |
| Subject | Inbox, DSA, LLD, HLD, Networking, Database, OS & Linux, or Other. Defaults to Inbox. |
| Status | Unread, In progress, Done, or Revisit. Defaults to Unread. |
| Source | Paste a URL, or use a Markdown link such as `[LeetCode](https://leetcode.com/problems/meeting-rooms-ii/)`. |
| Tags | Comma-separated or space-separated tags, for example `#caching, #interview`. |
| Related notes | Obsidian links such as `[[HLD/Caching/Cache Invalidation]]`. Use `<br>` between multiple links. |
| Priority | Optional: High, Normal, or Low. Defaults to Normal; remove the whole column if you do not need it. |

Keep **Question / topic** and **Subject** as the table's column names. Columns can be reordered. Blank question rows are ignored.

In Obsidian's table editor, insert links as usual. If editing Markdown source with a link alias, escape its pipe inside the table: `[[HLD/Caching/Cache Invalidation\|Invalidation]]`. The website resolves matching published notes; missing targets remain visible as text.

## Start a new week

1. Create a note under **Study Hub/Weeks**, named with the ISO week, for example **2026-W46**.
2. Run **Templates: Insert template → Weekly Review**.
3. Add discoveries to the table and use the focus/review headings beneath it.

The Templates folder is **Study Hub/Templates**. Set it in **Settings → Templates** if using a new machine. Templates are excluded from the website.

## Browse the website

**Discoveries** groups a week's rows by subject. **Progress** groups them by status. **Backlog** includes unfinished rows from every week; **Revisit** includes all rows with that status. Search, tags, and priority filters work across the selected view.

Card titles open their row in the weekly table. Related-note links open the existing notebook notes. The website reads the same weekly Markdown files; there is no second list to maintain.

## Edit locally, then sync

Edit table cells in Obsidian. Refresh the local preview after saving. The website is read-only; the native Base and per-card files are no longer used. Review and sync through Git when ready. Keep unfinished discoveries in their original week rather than copying them forward.
