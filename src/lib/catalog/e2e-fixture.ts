export function isE2eCatalogFixture(product: {
  name: string;
  sku: string;
}): boolean {
  return (
    product.sku.startsWith("PW-") ||
    product.name.startsWith("Playwright Katalog")
  );
}
