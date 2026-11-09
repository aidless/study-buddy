// Not a test runner entry.
//
// This file used to call buildMigrationPlan and expect snake_case rows,
// owner filtering, and a running focus session flipped to done. The function
// in src/lib/migrateLocalToCloud.js does not do that. Loading it under plain
// node also crashes: src/lib/supabase.js reads import.meta.env, which Vite
// defines and node does not.
//
// The assertions that match the current function live in
// test/unit/migratePlan.test.js and run under `npm test`.

console.error(
  'migrateLocalToCloud.test.mjs is a retired script. npm test covers buildMigrationPlan in test/unit/migratePlan.test.js.'
)
process.exit(2)
