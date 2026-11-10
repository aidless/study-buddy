// Incomplete recovery, not a test.
//
// The only git revision of this file (c29d8f6, 2026-08-08) is a truncated
// fragment: the puppeteer import sat inside a comment, and the file ended
// mid-statement inside puppeteer.launch. It cited a machine-local Edge path
// and a machine-local screenshot directory. Neither path is in this repo.
// npm test and CI do not run this file.
//
// The 2026-08-07 note 用户视角实测报告_20260807.md describes a session that
// this tree can no longer replay.

console.error(
  'user_perspective_e2e.mjs is an incomplete recovered fragment, not a runnable test. It is not part of npm test or CI.'
)
process.exit(2)
