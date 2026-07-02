#!/usr/bin/env node
// JobPulse job watcher.
//
// Pulls early-career listings from SimplifyJobs feeds and target-company ATS
// boards, filters them to CPT-workable roles, diffs against previously seen
// jobs, and pushes new matches to Telegram and/or Discord.
//
// Zero dependencies — runs on Node 18+ (global fetch).
//
// Usage:
//   node scripts/watch-jobs.mjs                 normal run (notify + update state)
//   node scripts/watch-jobs.mjs --dry-run       print matches, touch nothing
//   node scripts/watch-jobs.mjs --baseline      mark everything seen, no notifications
//   node scripts/watch-jobs.mjs --test-notify   send a test message to both channels
//
// Env:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID   Telegram channel (optional)
//   DISCORD_WEBHOOK_URL                    Discord channel (optional)
//   STATE_DIR                              where seen.json/feed.json live (default: state)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config, isUsLocation } from "./watch-config.mjs";

const STATE_DIR = process.env.STATE_DIR || "state";
const SEEN_PATH = path.join(STATE_DIR, "seen.json");
const FEED_PATH = path.join(STATE_DIR, "feed.json");

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const BASELINE = args.has("--baseline");
const TEST_NOTIFY = args.has("--test-notify");

// ---------------------------------------------------------------- utilities

function log(...parts) {
  console.log(new Date().toISOString(), ...parts);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "JobPulse-watcher (personal job tracker)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function classifyRoleType(title, sourceKind) {
  if (/co-?op/i.test(title)) return "co-op";
  if (/\bintern(ship)?\b/i.test(title)) return "internship";
  if (/\b(new ?grad|university grad|early career|entry[- ]?level|graduate (software )?engineer)\b/i.test(title))
    return "new-grad";
  return sourceKind === "new-grad" ? "new-grad" : "internship";
}

function scoreJob(job) {
  const hay = `${job.company} ${job.title}`.toLowerCase();
  const total = config.keywords.reduce((s, k) => s + k.weight, 0) || 1;
  let matched = 0;
  const matchedWords = [];
  for (const k of config.keywords) {
    if (hay.includes(k.word)) {
      matched += k.weight;
      matchedWords.push(k.word);
    }
  }
  let score = Math.round(60 * Math.sqrt(matched / total));
  if (job.fromAtsBoard) score += config.atsBoardBonus;
  if (job.sponsorship === "yes") score += 10;
  return { score: Math.min(100, score), matchedWords };
}

function mapSponsorship(raw) {
  if (!raw) return "unknown";
  if (/offers sponsorship/i.test(raw)) return "yes";
  if (/does not offer/i.test(raw)) return "no";
  return "unknown";
}

// ------------------------------------------------------------------ sources

function collectSimplify(listings, source) {
  const now = Date.now() / 1000;
  const maxAge = config.maxAgeDays * 86400;
  const out = [];
  for (const it of listings) {
    if (!it.active || it.is_visible === false) continue;
    const posted = it.date_updated || it.date_posted || 0;
    if (now - posted > maxAge) continue;
    if (!config.titleInclude.test(it.title)) continue;
    if (config.titleExclude.test(it.title)) continue;
    if (/hardware/i.test(it.category || "")) continue;
    const usLocs = (it.locations || []).filter(isUsLocation);
    if (usLocs.length === 0) continue;
    if (/citizenship is required/i.test(it.sponsorship || "")) continue;

    const roleType = classifyRoleType(it.title, source.kind);
    let term;
    let stretch = false;
    if (source.kind === "new-grad" || roleType === "new-grad") {
      term = config.newGradTermLabel;
    } else {
      const terms = it.terms || [];
      term = config.internTerms.find((t) => terms.includes(t));
      if (!term) {
        term = config.stretchTerms.find((t) => terms.includes(t));
        stretch = !!term;
      }
      if (!term) continue; // no workable term for F-1
    }

    out.push({
      key: `simplify:${it.id}`,
      company: it.company_name,
      title: it.title,
      url: it.url,
      locations: usLocs.slice(0, 3),
      term,
      roleType,
      stretch,
      sponsorship: mapSponsorship(it.sponsorship),
      posted: posted * 1000,
      source: source.name,
      fromAtsBoard: false,
    });
  }
  return out;
}

async function fetchAtsBoard(entry) {
  if (entry.type === "greenhouse") {
    const data = await fetchJson(
      `https://boards-api.greenhouse.io/v1/boards/${entry.board}/jobs`
    );
    return (data.jobs || []).map((j) => ({
      id: `gh:${entry.board}:${j.id}`,
      title: j.title,
      url: j.absolute_url,
      location: j.location?.name ?? "",
      updated: j.updated_at ? Date.parse(j.updated_at) : Date.now(),
    }));
  }
  if (entry.type === "ashby") {
    const data = await fetchJson(
      `https://api.ashbyhq.com/posting-api/job-board/${entry.board}`
    );
    return (data.jobs || []).map((j) => ({
      id: `ashby:${entry.board}:${j.id}`,
      title: j.title,
      url: j.jobUrl || j.applyUrl,
      location: j.location ?? "",
      updated: Date.now(),
    }));
  }
  if (entry.type === "lever") {
    const data = await fetchJson(
      `https://api.lever.co/v0/postings/${entry.board}?mode=json`
    );
    return (data || []).map((j) => ({
      id: `lever:${entry.board}:${j.id}`,
      title: j.text,
      url: j.hostedUrl,
      location: j.categories?.location ?? "",
      updated: j.createdAt || Date.now(),
    }));
  }
  throw new Error(`Unknown ATS type: ${entry.type}`);
}

function collectAts(rawJobs, entry) {
  const out = [];
  for (const j of rawJobs) {
    if (!config.titleInclude.test(j.title)) continue;
    if (config.titleExclude.test(j.title)) continue;
    if (!config.earlyCareer.test(j.title)) continue;
    if (j.location && !isUsLocation(j.location) && !/remote/i.test(j.location))
      continue;

    const roleType = classifyRoleType(j.title, "ats");
    let term;
    let stretch = false;
    if (roleType === "new-grad") {
      term = config.newGradTermLabel;
    } else {
      // Try to read a term straight from the title; fall back to next co-op term.
      const m = j.title.match(/\b(Spring|Summer|Fall|Winter)\s+(20\d{2})\b/i);
      if (m) {
        term = `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}`;
        if (
          !config.internTerms.includes(term) &&
          !config.stretchTerms.includes(term)
        )
          continue;
        stretch = config.stretchTerms.includes(term);
      } else {
        term = config.internTerms[0];
      }
    }

    out.push({
      key: j.id,
      company: entry.company,
      title: j.title,
      url: j.url,
      locations: j.location ? [j.location] : [],
      term,
      roleType,
      stretch,
      sponsorship: "unknown",
      posted: j.updated,
      source: `${entry.company} careers (${entry.type})`,
      fromAtsBoard: true,
    });
  }
  return out;
}

// ------------------------------------------------------------- notifications

const ROLE_EMOJI = { "co-op": "🔄", internship: "🎓", "new-grad": "💼" };

function jobLineHtml(job) {
  const fire = job.score >= 60 ? "🔥 " : job.score >= 35 ? "⭐ " : "";
  const spons =
    job.sponsorship === "yes"
      ? " · 🛂 sponsors"
      : job.sponsorship === "no"
        ? " · ⚠️ no sponsorship"
        : "";
  const stretch = job.stretch ? " · ⚠️ post-grad term" : "";
  const loc = job.locations[0] ?? "";
  return (
    `${fire}<b>${escapeHtml(job.company)}</b> — ${escapeHtml(job.title)}\n` +
    `${ROLE_EMOJI[job.roleType] ?? ""} ${job.term} · 📍 ${escapeHtml(loc)}${spons}${stretch}\n` +
    `<a href="${escapeHtml(job.url)}">Apply</a> · fit ${job.score}`
  );
}

function jobLineMd(job) {
  const fire = job.score >= 60 ? "🔥 " : job.score >= 35 ? "⭐ " : "";
  const spons =
    job.sponsorship === "yes"
      ? " · 🛂 sponsors"
      : job.sponsorship === "no"
        ? " · ⚠️ no sponsorship"
        : "";
  const stretch = job.stretch ? " · ⚠️ post-grad term" : "";
  const loc = job.locations[0] ?? "";
  return `${fire}**${job.company}** — [${job.title}](${job.url})\n${ROLE_EMOJI[job.roleType] ?? ""} ${job.term} · 📍 ${loc}${spons}${stretch} · fit ${job.score}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendTelegram(text) {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();
  if (!token || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) log("Telegram send failed:", res.status, await res.text());
  return res.ok;
}

async function sendDiscord(content) {
  const url = (process.env.DISCORD_WEBHOOK_URL || "").trim();
  if (!url) return false;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok && res.status !== 204)
    log("Discord send failed:", res.status, await res.text());
  return res.ok || res.status === 204;
}

/** Batch jobs into messages under each platform's length limit. */
function chunkMessages(lines, header, limit) {
  const messages = [];
  let current = header;
  for (const line of lines) {
    const candidate = `${current}\n\n${line}`;
    if (candidate.length > limit && current !== header) {
      messages.push(current);
      current = `${header}\n\n${line}`;
    } else {
      current = candidate;
    }
  }
  if (current !== header) messages.push(current);
  return messages;
}

async function notify(jobs) {
  const capped = jobs.slice(0, config.maxNotificationsPerRun);
  const extra = jobs.length - capped.length;

  const headerHtml = `🚨 <b>${jobs.length} new job${jobs.length === 1 ? "" : "s"}</b> matching your profile`;
  const htmlLines = capped.map(jobLineHtml);
  if (extra > 0) htmlLines.push(`…and ${extra} more — see the JobPulse feed.`);
  for (const msg of chunkMessages(htmlLines, headerHtml, 3800)) {
    await sendTelegram(msg);
  }

  const headerMd = `🚨 **${jobs.length} new job${jobs.length === 1 ? "" : "s"}** matching your profile`;
  const mdLines = capped.map(jobLineMd);
  if (extra > 0) mdLines.push(`…and ${extra} more — see the JobPulse feed.`);
  for (const msg of chunkMessages(mdLines, headerMd, 1900)) {
    await sendDiscord(msg);
  }
}

// ------------------------------------------------------------------ main

async function loadState() {
  try {
    const seen = JSON.parse(await readFile(SEEN_PATH, "utf8"));
    const feedRaw = JSON.parse(await readFile(FEED_PATH, "utf8"));
    const feed = (Array.isArray(feedRaw) ? feedRaw : feedRaw.jobs || []).filter(
      (f) => f && f.key
    );
    return { seen, feed, isBaseline: Object.keys(seen).length === 0 };
  } catch {
    return { seen: {}, feed: [], isBaseline: true };
  }
}

async function saveState(seen, feed) {
  // Prune seen-keys older than 90 days so the file doesn't grow forever;
  // maxAgeDays keeps those old listings from re-notifying anyway.
  const cutoff = Date.now() - 90 * 86400 * 1000;
  for (const [key, ts] of Object.entries(seen)) {
    if (ts < cutoff) delete seen[key];
  }
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(SEEN_PATH, JSON.stringify(seen));
  await writeFile(
    FEED_PATH,
    JSON.stringify(
      { updatedAt: new Date().toISOString(), jobs: feed },
      null,
      1
    )
  );
}

async function main() {
  if (TEST_NOTIFY) {
    const ok1 = await sendTelegram(
      "✅ JobPulse watcher connected. You'll get new-job alerts here."
    );
    const ok2 = await sendDiscord(
      "✅ JobPulse watcher connected. You'll get new-job alerts here."
    );
    log(`test-notify: telegram=${ok1} discord=${ok2}`);
    return;
  }

  const jobs = [];

  for (const source of config.simplifySources) {
    try {
      const listings = await fetchJson(source.url);
      const collected = collectSimplify(listings, source);
      log(`${source.name}: ${listings.length} listings -> ${collected.length} matches`);
      jobs.push(...collected);
    } catch (err) {
      log(`FAILED ${source.name}: ${err.message}`);
    }
  }

  for (const entry of config.atsBoards) {
    try {
      const raw = await fetchAtsBoard(entry);
      const collected = collectAts(raw, entry);
      log(`${entry.company}: ${raw.length} postings -> ${collected.length} matches`);
      jobs.push(...collected);
    } catch (err) {
      log(`FAILED ${entry.company} (${entry.board}): ${err.message}`);
    }
  }

  // Score and dedupe (same job can appear via aggregator and ATS — keep both
  // keys seen but only one feed entry per company+title).
  for (const job of jobs) {
    const { score, matchedWords } = scoreJob(job);
    job.score = score;
    job.matchedWords = matchedWords;
  }

  const { seen, feed, isBaseline } = await loadState();
  const now = Date.now();
  const fresh = [];
  const dedupe = new Set(
    feed.map((f) => `${f.company}|${f.title}`.toLowerCase())
  );
  for (const job of jobs) {
    if (seen[job.key]) continue;
    seen[job.key] = now;
    const dupeKey = `${job.company}|${job.title}`.toLowerCase();
    if (dedupe.has(dupeKey)) continue;
    dedupe.add(dupeKey);
    fresh.push(job);
  }

  fresh.sort((a, b) => b.score - a.score);
  log(`new matches: ${fresh.length}${isBaseline ? " (baseline run — not notifying)" : ""}`);

  if (DRY_RUN) {
    for (const j of fresh.slice(0, 40)) {
      console.log(
        `  [${String(j.score).padStart(3)}] ${j.company} — ${j.title} | ${j.term} | ${j.roleType} | ${j.locations[0] ?? ""}`
      );
    }
    return;
  }

  if (fresh.length > 0 && !isBaseline && !BASELINE) {
    await notify(fresh);
  }

  const newFeed = [
    ...fresh.map((j) => ({ ...j, firstSeen: now })),
    ...feed,
  ].slice(0, config.feedLimit);
  await saveState(seen, newFeed);
  log(`state saved: ${Object.keys(seen).length} seen, feed size ${newFeed.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
