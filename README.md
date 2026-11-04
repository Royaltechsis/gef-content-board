# GEF Cairo Content Board

Shared content board for the CycleBreeze team at the Global Entrepreneurship Festival (GEF), Cairo, Nov 6-8 2026.

Live: https://gef-content.sites.tab.bot/

## What it does
- 124+ content ideas (trip ideas, professional posts, trends, talking sounds, classic sounds, our own adapted references)
- Per card: status (Idea, Script, Filmed, Edited, Posted), assignee, star, notes
- Edit any card (title, sound, on-screen text, how to shoot), delete/restore, add new ideas
- Paste or delete TikTok / Instagram reference links
- Syncs for the whole team with the team key (in the link hash), works offline, export/import JSON

## Files
- `index.html`, `styles.css`, `app.js` - the front end (plain JS, no build step)
- `data.js` - the built-in ideas (`window.ITEMS=[...]`)
- `_worker.js` - Cloudflare Worker API (`/api/state`, `/api/item`) storing team edits in a D1 table `st`
- `tab-site.json` - deploy config (worker + D1 binding `DB`)

The team key is never stored in the repo, only its SHA-256 hash.
