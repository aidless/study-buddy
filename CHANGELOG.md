# Changelog

All notable changes to this repository are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Document what the tree is and what it does not claim. STATUS remains
  WORK-IN-PROGRESS: there is no measured completion-rate study.
- `npm test` covers `buildMigrationPlan` as it behaves today
  (`test/unit/migratePlan.test.js`). The older node script expected a different
  shape and is not part of CI. CI and Pages install with `npm ci`. Manual
  browser/emulator scripts no longer embed machine paths.
- App version stays 0.2.1. That number is not a store release and not a PyPI
  release.

- Governance baseline: LICENSE, security policy, code of conduct, contributor and
  support guides, issue and pull-request templates, CODEOWNERS, dependabot, and
  `.editorconfig` added. No research content changed.
