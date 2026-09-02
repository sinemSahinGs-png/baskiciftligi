export const REQUIRED_MIGRATION_VERSIONS = [
  "20260817220000",
  "20260817220100",
  "20260817220200",
  "20260817220300",
  "20260817220400",
  "20260817220500",
  "20260817220600",
  "20260817220700",
  "20260818040000",
  "20260818040100",
  "20260818040200",
  "20260818050000",
  "20260820060000",
  "20260820070000",
  "20260820080000",
  "20260820090000",
  "20260820100000",
  "20260902120000",
] as const;

export const REQUIRED_PUBLIC_TABLES = [
  "profiles",
  "products",
  "product_variants",
  "product_images",
  "categories",
  "collections",
  "inventory_levels",
  "catalog_audit_log",
  "print_quotes",
  "printer_profiles",
  "print_profiles",
  "manufacturing_files",
  "quote_jobs",
  "manufacturing_quotes",
  "quote_status_events",
  "pricing_configs",
  "quote_revocations",
  "pricing_activation_audit",
  "commerce_shipping_policies",
  "profile_role_audit",
  "orders",
  "order_items",
] as const;

export const REQUIRED_STORAGE_BUCKETS = [
  "catalog-media",
  "model-uploads",
  "manufacturing-objects",
] as const;

export const STAFF_ROLES = [
  "owner",
  "admin",
  "catalog_manager",
  "editor",
  "viewer",
] as const;
