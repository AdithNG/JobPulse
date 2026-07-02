// Resume analysis: extract weighted fit keywords from pasted resume text.
// Runs entirely client-side — the resume never leaves the browser.

import { FitKeyword } from "./types";

interface SkillDef {
  word: string; // canonical keyword, matched against job titles/tags later
  weight: number; // base importance when found in a resume
  aliases?: string[]; // other spellings to detect in the resume text
}

// Keywords are chosen to be words that actually appear in job titles and
// tags, since that's what fit scoring matches against.
const SKILLS: SkillDef[] = [
  // Core role signals
  { word: "backend", weight: 10, aliases: ["back-end", "back end"] },
  { word: "distributed", weight: 9, aliases: ["distributed systems"] },
  { word: "full stack", weight: 7, aliases: ["fullstack", "full-stack"] },
  { word: "frontend", weight: 5, aliases: ["front-end", "front end"] },
  { word: "infrastructure", weight: 7 },
  { word: "platform", weight: 5 },
  { word: "microservice", weight: 6, aliases: ["microservices"] },
  { word: "api", weight: 5, aliases: ["apis", "rest"] },
  { word: "devops", weight: 4 },
  { word: "security", weight: 4 },
  { word: "mobile", weight: 4 },
  { word: "embedded", weight: 4 },
  { word: "data", weight: 3 },
  { word: "machine learning", weight: 6, aliases: ["ml"] },
  { word: "ai", weight: 5, aliases: ["artificial intelligence", "llm", "genai"] },

  // Cloud & infra
  { word: "aws", weight: 8, aliases: ["amazon web services", "ec2", "s3", "lambda"] },
  { word: "azure", weight: 5 },
  { word: "gcp", weight: 5, aliases: ["google cloud"] },
  { word: "cloud", weight: 6 },
  { word: "kubernetes", weight: 4, aliases: ["k8s"] },
  { word: "docker", weight: 3 },

  // Languages & frameworks
  { word: "java", weight: 5 },
  { word: "python", weight: 5 },
  { word: "typescript", weight: 4 },
  { word: "javascript", weight: 3 },
  { word: "c++", weight: 4 },
  { word: "go", weight: 4, aliases: ["golang"] },
  { word: "rust", weight: 4 },
  { word: "react", weight: 3 },
  { word: "node", weight: 3, aliases: ["node.js", "nodejs"] },
  { word: "sql", weight: 3, aliases: ["postgresql", "postgres", "mysql"] },
  { word: "kafka", weight: 4 },
  { word: "redis", weight: 3 },
  { word: "graphql", weight: 3 },

  // Domains
  { word: "fintech", weight: 8, aliases: ["financial technology"] },
  { word: "payment", weight: 6, aliases: ["payments"] },
  { word: "banking", weight: 5, aliases: ["bank", "credit"] },
  { word: "trading", weight: 5 },
  { word: "healthcare", weight: 5, aliases: ["health"] },
  { word: "robotics", weight: 5 },
  { word: "gaming", weight: 4, aliases: ["game"] },
  { word: "e-commerce", weight: 4, aliases: ["ecommerce"] },
];

function termRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Trailing \b fails after non-word chars like "c++", so only add it
  // when the term ends in a word character.
  const tail = /\w$/.test(term) ? "\\b" : "";
  return new RegExp(`\\b${escaped}${tail}`, "g");
}

export interface ResumeAnalysis {
  keywords: FitKeyword[];
  totalMatches: number;
}

/**
 * Extract weighted fit keywords from resume text. More mentions of a skill
 * nudge its weight up (capped), so what you actually worked with the most
 * ranks highest.
 */
export function analyzeResume(text: string): ResumeAnalysis {
  const lower = text.toLowerCase();
  const keywords: FitKeyword[] = [];
  let totalMatches = 0;
  for (const skill of SKILLS) {
    const terms = [skill.word, ...(skill.aliases ?? [])];
    let count = 0;
    for (const term of terms) {
      count += (lower.match(termRegex(term)) ?? []).length;
    }
    if (count > 0) {
      totalMatches += count;
      keywords.push({
        word: skill.word,
        weight: Math.min(15, skill.weight + Math.min(count - 1, 4)),
      });
    }
  }
  keywords.sort((a, b) => b.weight - a.weight);
  return { keywords: keywords.slice(0, 24), totalMatches };
}
