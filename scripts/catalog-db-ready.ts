import { REQUIRED_MIGRATION_VERSIONS, REQUIRED_PUBLIC_TABLES, REQUIRED_STORAGE_BUCKETS } from "../src/lib/launch/required-schema";

console.log(
  JSON.stringify(
    {
      applyAutomatically: false,
      requiredMigrations: REQUIRED_MIGRATION_VERSIONS,
      requiredTables: REQUIRED_PUBLIC_TABLES,
      requiredBuckets: REQUIRED_STORAGE_BUCKETS,
      command: "npx supabase db push",
    },
    null,
    2,
  ),
);
