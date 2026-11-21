#!/usr/bin/env node
/**
 * Mirrors `.agents/skills` into `.claude/skills` so Claude Code discovers the
 * same versioned skills used by Antigravity, Codex, and Kimi.
 *
 * Uses a relative symlink on POSIX (Linux/macOS) and a directory junction on
 * Windows (works without Administrator privileges or Developer Mode).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, ".agents", "skills");
const claudeDir = path.join(repoRoot, ".claude");
const targetLink = path.join(claudeDir, "skills");

if (!fs.existsSync(sourceDir)) {
  console.error(`Source skills directory not found: ${sourceDir}`);
  process.exit(1);
}

fs.mkdirSync(claudeDir, { recursive: true });

if (fs.existsSync(targetLink) || isSymlink(targetLink)) {
  const stat = fs.lstatSync(targetLink);
  if (stat.isSymbolicLink()) {
    const resolved = path.resolve(claudeDir, fs.readlinkSync(targetLink));
    if (resolved === sourceDir) {
      console.log(`Already linked: ${rel(targetLink)} -> ${rel(sourceDir)}`);
      process.exit(0);
    }
    fs.unlinkSync(targetLink);
  } else {
    console.error(
      `Refusing to overwrite non-symlink path at ${rel(targetLink)}. Remove it manually and re-run.`,
    );
    process.exit(1);
  }
}

const isWindows = process.platform === "win32";
const linkTarget = isWindows ? sourceDir : path.relative(claudeDir, sourceDir);
const linkType = isWindows ? "junction" : "dir";

fs.symlinkSync(linkTarget, targetLink, linkType);
console.log(
  `Linked ${rel(targetLink)} -> ${rel(sourceDir)} (${isWindows ? "Windows junction" : "symlink"})`,
);

function isSymlink(targetPath) {
  try {
    return fs.lstatSync(targetPath).isSymbolicLink();
  } catch {
    return false;
  }
}

function rel(targetPath) {
  return path.relative(repoRoot, targetPath) || ".";
}
