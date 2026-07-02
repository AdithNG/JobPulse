# Job watcher — notification setup

The watcher runs on GitHub Actions every ~10 minutes ([.github/workflows/job-watch.yml](../.github/workflows/job-watch.yml)). It already works without any setup — new jobs land in the **Feed** tab. To also get pushed to your phone, wire up Telegram and/or Discord (both free, ~5 minutes total).

## Telegram (recommended — instant phone push)

1. In Telegram, message **@BotFather** → send `/newbot` → pick a name (e.g. `JobPulse Alerts`) and a username (e.g. `adith_jobpulse_bot`).
2. BotFather replies with a **bot token** like `7123456789:AAE...`. Copy it.
3. Open a chat with your new bot and send it any message (e.g. "hi") — this is required so it can message you back.
4. Get your **chat id**: open
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   in a browser and find `"chat":{"id":123456789,...}` in the response.

## Discord

1. In any Discord server you control: **Server Settings → Integrations → Webhooks → New Webhook**.
2. Pick the channel, copy the **webhook URL**.

## Add the secrets to GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**, or with the GitHub CLI:

```bash
gh secret set TELEGRAM_BOT_TOKEN --body "7123456789:AAE..."
gh secret set TELEGRAM_CHAT_ID   --body "123456789"
gh secret set DISCORD_WEBHOOK_URL --body "https://discord.com/api/webhooks/..."
```

Any channel whose secret is missing is silently skipped — you can set up just one.

## Test it

Repo → **Actions → Job watcher → Run workflow** → check **"Send a test notification"** → Run. You should get "✅ JobPulse watcher connected" on every configured channel within a minute.

## How it works / tuning

- **Sources:** SimplifyJobs internship + new-grad feeds (community-maintained, updated all day) and direct Greenhouse/Ashby/Lever boards for the target companies in [scripts/watch-config.mjs](../scripts/watch-config.mjs). Add/remove companies there — find a company's board name in its careers-page URL (e.g. `boards.greenhouse.io/stripe` → board `stripe`).
- **Filters:** software-engineering titles only, US locations, no citizenship-required roles, and only terms that work on F-1: Fall 2026 / Spring 2027 / Winter 2027 co-ops & internships, everything new-grad, and Summer 2027 flagged as "post-grad term".
- **State:** lives on the [`data` branch](https://github.com/AdithNG/JobPulse/tree/data) (`seen.json` = already-notified job keys, `feed.json` = what the Feed tab shows). Main branch history stays clean and Vercel doesn't redeploy on watcher commits (`vercel.json` disables the `data` branch).
- **Flood protection:** max 15 notifications per run; the rest still appear in the Feed. The very first run baselines silently.
- **Local testing:** `node scripts/watch-jobs.mjs --dry-run` prints matches without notifying or saving.

## Expectations

Detection latency is roughly 10–25 minutes after a posting appears in a source (cron interval + GitHub's scheduling delay). The direct ATS boards catch postings the moment they go live; the SimplifyJobs lists depend on when maintainers merge new entries (usually same-day, often within hours).
