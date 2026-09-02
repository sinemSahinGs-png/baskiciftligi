import { expect, test } from "@playwright/test";
import path from "node:path";

import { createStoreZip } from "../src/domain/manufacturing/threemf/store-zip";

const cube = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.stl");
const cube3mf = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.3mf");

const CUBE_VERTS = `
<vertex x="0" y="0" z="0"/>
<vertex x="10" y="0" z="0"/>
<vertex x="10" y="10" z="0"/>
<vertex x="0" y="10" z="0"/>
<vertex x="0" y="0" z="10"/>
<vertex x="10" y="0" z="10"/>
<vertex x="10" y="10" z="10"/>
<vertex x="0" y="10" z="10"/>
`;
const CUBE_TRIS = `
<triangle v1="0" v2="1" v3="2"/>
<triangle v1="0" v2="2" v3="3"/>
<triangle v1="4" v2="7" v3="6"/>
<triangle v1="4" v2="6" v3="5"/>
<triangle v1="0" v2="4" v3="5"/>
<triangle v1="0" v2="5" v3="1"/>
<triangle v1="3" v2="2" v3="6"/>
<triangle v1="3" v2="6" v3="7"/>
<triangle v1="0" v2="3" v3="7"/>
<triangle v1="0" v2="7" v3="4"/>
<triangle v1="1" v2="5" v3="6"/>
<triangle v1="1" v2="6" v3="2"/>
`;

function bambuStudio3mf() {
  const model = `<?xml version="1.0"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model"><mesh><vertices>${CUBE_VERTS}</vertices><triangles>${CUBE_TRIS}</triangles></mesh></object>
    <object id="2" type="model"><mesh><vertices>${CUBE_VERTS}</vertices><triangles>${CUBE_TRIS}</triangles></mesh></object>
  </resources>
  <build>
    <item objectid="1"/>
    <item objectid="2" transform="1 0 0 0 1 0 0 0 1 40 0 0"/>
  </build>
</model>`;
  return Buffer.from(
    createStoreZip({
      "[Content_Types].xml": `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>`,
      "_rels/.rels": `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`,
      "3D/3dmodel.model": model,
      "Metadata/plate_1.json": JSON.stringify({ bbox_objects: [{ id: 1 }] }),
      "Metadata/plate_2.json": JSON.stringify({ bbox_objects: [{ id: 2 }] }),
      "Metadata/plate_1.gcode": "; Bambu sliced gcode must not be a price source\nG1 X0\n",
    }),
  );
}

async function uploadCube(page: import("@playwright/test").Page) {
  await page.goto("/model-yukle");
  await expect(page.getByTestId("mesh-viewer")).toBeVisible({ timeout: 15_000 });
  const input = page.locator("#model-file").first();
  await input.setInputFiles(cube);
  await expect(page.getByText("20mm-cube.stl").first()).toBeVisible({ timeout: 20_000 });
}

test.describe("model preparation studio", () => {
  test("workspace shows build plate viewer and analysis CTA", async ({ page }) => {
    await uploadCube(page);
    await page.getByRole("button", { name: "Analiz et", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Analiz et ve fiyatı hesapla" }).first(),
    ).toBeVisible();
    await expect(page.getByText(/Analiz servisine şu anda ulaşılamıyor|Fiyat, dilimleme bitince|Fiyat için analiz/i).first()).toBeVisible();
    await expect(page.getByText(/Docker Compose|Dilimleme işçisi çevrimdışı/i)).toHaveCount(0);
  });

  test("rotate tool exposes baskı yönü controls", async ({ page, isMobile }) => {
    await uploadCube(page);
    await page.getByRole("button", { name: "Döndür" }).click();
    if (isMobile) {
      await page.getByRole("button", { name: "Genişlet" }).click();
    }
    await page.getByRole("button", { name: "Boyut ve yön" }).click();
    await expect(page.getByText("Baskı yönü")).toBeVisible();
  });

  test("drop zone and keyboard reach the file input", async ({ page }) => {
    await page.goto("/model-yukle");
    await expect(page.getByTestId("mesh-viewer")).toBeVisible({ timeout: 15_000 });
    const input = page.locator("#model-file").first();
    await expect(input).toHaveAttribute("accept", /3mf/i);
    await page.keyboard.press("Tab");
    await input.setInputFiles(cube);
    await expect(page.getByText("20mm-cube.stl").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/X 20\.0|X 19\./).first()).toBeVisible({ timeout: 20_000 });
  });

  test("standard 3MF and Bambu Studio multi-plate are explicit", async ({ page, isMobile }) => {
    await page.goto("/model-yukle");
    await expect(page.getByTestId("mesh-viewer")).toBeVisible({ timeout: 15_000 });
    const input = page.locator("#model-file").first();
    await input.setInputFiles(cube3mf);
    await expect(page.getByText("20mm-cube.3mf").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/X 20\.0|X 19\./).first()).toBeVisible({ timeout: 20_000 });

    await page.goto("/model-yukle");
    await expect(page.getByTestId("mesh-viewer")).toBeVisible({ timeout: 15_000 });
    await page.locator("#model-file").first().setInputFiles({
      name: "bambu-studio.3mf",
      mimeType: "model/3mf",
      buffer: bambuStudio3mf(),
    });
    await expect(
      page.getByText("Bu Bambu Studio projesinde birden fazla plaka var. Analiz edilecek plakayı seçin.").first(),
    ).toBeVisible({ timeout: 20_000 });
    if (isMobile) {
      const expand = page.getByRole("button", { name: "Genişlet" });
      if (await expand.isVisible().catch(() => false)) await expand.click();
    }
    await page.getByRole("button", { name: "Model" }).click();
    await page.getByRole("button", { name: /Plaka 1/ }).click();
    await expect(page.getByText(/X 10\.0|X 9\./).first()).toBeVisible({ timeout: 20_000 });
  });

  test("direct mesh drag vs empty-orbit and reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await uploadCube(page);
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20_000 });
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    const cx = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const cy = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 48, cy + 12, { steps: 8 });
    await page.mouse.up();
    await page.mouse.move((box?.x ?? 0) + 16, (box?.y ?? 0) + 16);
    await page.mouse.down();
    await page.mouse.move((box?.x ?? 0) + 40, (box?.y ?? 0) + 40, { steps: 6 });
    await page.mouse.up();
    await expect(page.getByTestId("configurator-shell")).toHaveAttribute(
      "data-studio-phase",
      /ready|stale_quote|parsing/,
    );
  });
});
