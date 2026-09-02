import { loadThreeMfPackage } from "@/domain/manufacturing/threemf/load-package";
import { parseThreeMfFromFiles } from "@/domain/manufacturing/threemf/parse-model";
import { createStoreZip } from "@/domain/manufacturing/threemf/store-zip";
import { ThreeMfError } from "@/domain/manufacturing/threemf/types";
import { readZipEntry } from "@/domain/manufacturing/zip";
import { inspectZip, ZipValidationError } from "@/domain/manufacturing/zip-inspect";
import { analyzeMesh } from "@/domain/manufacturing/mesh";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";
import { ZIP_MAX_UNCOMPRESSED_BYTES } from "@/domain/manufacturing/types";
import { plateToBinaryStl } from "@/domain/manufacturing/threemf/plate-stl";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

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

function modelXml(body: string, unit = "millimeter") {
  return `<?xml version="1.0"?>
<model unit="${unit}" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
${body}
</model>`;
}

function packageOf(model: string, extra: Record<string, string> = {}) {
  return createStoreZip({
    "[Content_Types].xml": `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>`,
    "_rels/.rels": `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`,
    "3D/3dmodel.model": model,
    ...extra,
  });
}

describe("3MF package parser", () => {
  it("parses the 20 mm cube fixture", () => {
    const bytes = new Uint8Array(
      readFileSync(path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.3mf")),
    );
    const parsed = loadThreeMfPackage(bytes, readZipEntry);
    expect(parsed.plates).toHaveLength(1);
    expect(parsed.plates[0]?.dimensionsMm.x).toBeCloseTo(20, 5);
    expect(parsed.plates[0]?.triangleCount).toBe(12);
  });

  it("accepts vertex attributes in any order", () => {
    const xml = modelXml(`
      <resources>
        <object id="1" type="model">
          <mesh>
            <vertices>
              <vertex z="0" y="0" x="0"/>
              <vertex z="0" y="0" x="5"/>
              <vertex z="0" y="5" x="0"/>
            </vertices>
            <triangles>
              <triangle v3="2" v2="1" v1="0"/>
            </triangles>
          </mesh>
        </object>
      </resources>
      <build><item objectid="1"/></build>
    `);
    const parsed = loadThreeMfPackage(packageOf(xml), readZipEntry);
    expect(parsed.plates[0]?.triangleCount).toBe(1);
    expect(parsed.plates[0]?.dimensionsMm.x).toBeCloseTo(5, 5);
  });

  it("applies nested component transforms", () => {
    const xml = modelXml(`
      <resources>
        <object id="1" type="model">
          <mesh>
            <vertices>${CUBE_VERTS}</vertices>
            <triangles>${CUBE_TRIS}</triangles>
          </mesh>
        </object>
        <object id="2" type="model">
          <components>
            <component objectid="1" transform="1 0 0 0 1 0 0 0 1 20 0 0"/>
          </components>
        </object>
      </resources>
      <build><item objectid="2"/></build>
    `);
    const parsed = loadThreeMfPackage(packageOf(xml), readZipEntry);
    const box = parsed.plates[0]!.boundingBoxMm;
    expect(box.min.x).toBeCloseTo(20, 5);
    expect(box.max.x).toBeCloseTo(30, 5);
  });

  it("converts centimeter units to millimeters", () => {
    const xml = modelXml(
      `
      <resources>
        <object id="1" type="model">
          <mesh>
            <vertices>
              <vertex x="0" y="0" z="0"/>
              <vertex x="1" y="0" z="0"/>
              <vertex x="0" y="1" z="0"/>
            </vertices>
            <triangles><triangle v1="0" v2="1" v3="2"/></triangles>
          </mesh>
        </object>
      </resources>
      <build><item objectid="1"/></build>
    `,
      "centimeter",
    );
    const parsed = loadThreeMfPackage(packageOf(xml), readZipEntry);
    expect(parsed.plates[0]?.dimensionsMm.x).toBeCloseTo(10, 5);
  });

  it("requires plate selection for Bambu multi-plate projects", () => {
    const xml = modelXml(`
      <resources>
        <object id="1" type="model"><mesh><vertices>${CUBE_VERTS}</vertices><triangles>${CUBE_TRIS}</triangles></mesh></object>
        <object id="2" type="model"><mesh><vertices>${CUBE_VERTS}</vertices><triangles>${CUBE_TRIS}</triangles></mesh></object>
      </resources>
      <build>
        <item objectid="1"/>
        <item objectid="2" transform="1 0 0 0 1 0 0 0 1 40 0 0"/>
      </build>
    `);
    const bytes = packageOf(xml, {
      "Metadata/plate_1.json": JSON.stringify({ bbox_objects: [{ id: 1 }] }),
      "Metadata/plate_2.json": JSON.stringify({ bbox_objects: [{ id: 2 }] }),
    });
    const parsed = loadThreeMfPackage(bytes, readZipEntry);
    expect(parsed.requiresPlateSelection).toBe(true);
    expect(parsed.plates).toHaveLength(2);
    expect(() =>
      analyzeMesh({
        filename: "bambu.3mf",
        bytes,
        buildVolumeMm: DEVELOPMENT_PRINTER.buildVolumeMm,
      }),
    ).toThrow(/plaka/i);
  });

  it("rejects XXE, cycles, path traversal and zip bombs", () => {
    const xxe = packageOf(
      `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><model></model>`,
    );
    expect(() => loadThreeMfPackage(xxe, readZipEntry)).toThrow(ThreeMfError);

    const cyclic = packageOf(
      modelXml(`
        <resources>
          <object id="1" type="model"><components><component objectid="2"/></components></object>
          <object id="2" type="model"><components><component objectid="1"/></components></object>
        </resources>
        <build><item objectid="1"/></build>
      `),
    );
    expect(() => loadThreeMfPackage(cyclic, readZipEntry)).toThrow(/döngü|derinlik/i);

    const traversal = createStoreZip({ "../evil.model": "<model/>" });
    expect(() => loadThreeMfPackage(traversal, readZipEntry)).toThrow(ThreeMfError);

    expect(() =>
      inspectZip(
        createStoreZip(
          { "3D/3dmodel.model": "abcd" },
          { claimedUncompressed: { "3D/3dmodel.model": ZIP_MAX_UNCOMPRESSED_BYTES + 1 } },
        ),
      ),
    ).toThrow(ZipValidationError);
  });

  it("ignores Bambu G-code payloads and still reads the model", () => {
    const xml = modelXml(`
      <resources>
        <ns:object id="1" type="model">
          <ns:mesh>
            <ns:vertices>${CUBE_VERTS}</ns:vertices>
            <ns:triangles>${CUBE_TRIS}</ns:triangles>
          </ns:mesh>
        </ns:object>
      </resources>
      <build><ns:item objectid="1"/></build>
    `);
    const bytes = packageOf(xml, {
      "Metadata/plate_1.gcode": "G1 X0 ; huge sliced gcode is not a price source\n".repeat(200),
    });
    const parsed = loadThreeMfPackage(bytes, readZipEntry);
    expect(parsed.plates[0]?.triangleCount).toBe(12);
  });

  it("keeps preview geometry identical to the STL extracted for the worker", () => {
    const xml = modelXml(`
      <resources>
        <object id="1" type="model"><mesh><vertices>${CUBE_VERTS}</vertices><triangles>${CUBE_TRIS}</triangles></mesh></object>
      </resources>
      <build><item objectid="1"/></build>
    `);
    const bytes = packageOf(xml);
    const parsed = loadThreeMfPackage(bytes, readZipEntry);
    const plate = parsed.plates[0]!;
    const stl = plateToBinaryStl(plate);
    const analysis = analyzeMesh({
      filename: "plate.stl",
      bytes: stl,
      buildVolumeMm: DEVELOPMENT_PRINTER.buildVolumeMm,
    });
    expect(analysis.dimensionsMm.x).toBeCloseTo(plate.dimensionsMm.x, 5);
    expect(analysis.dimensionsMm.y).toBeCloseTo(plate.dimensionsMm.y, 5);
    expect(analysis.dimensionsMm.z).toBeCloseTo(plate.dimensionsMm.z, 5);
    expect(analysis.triangleCount).toBe(plate.triangleCount);
  });

  it("rejects empty or broken 3MF packages", () => {
    const empty = packageOf(modelXml(`<resources></resources><build></build>`));
    expect(() => loadThreeMfPackage(empty, readZipEntry)).toThrow(/görüntülenebilir/i);
    expect(() => parseThreeMfFromFiles(new Map())).toThrow(ThreeMfError);
  });
});
