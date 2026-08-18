import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "fixtures", "meshes");
const src = path.join(root, "_3mf_src");
const out = path.join(root, "20mm-cube.3mf");

rmSync(src, { recursive: true, force: true });
mkdirSync(path.join(src, "3D"), { recursive: true });
mkdirSync(path.join(src, "_rels"), { recursive: true });

writeFileSync(
  path.join(src, "[Content_Types].xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>
`,
  "utf8",
);

writeFileSync(
  path.join(src, "_rels", ".rels"),
  `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>
`,
  "utf8",
);

writeFileSync(
  path.join(src, "3D", "3dmodel.model"),
  `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
          <vertex x="0" y="0" z="0"/>
          <vertex x="20" y="0" z="0"/>
          <vertex x="20" y="20" z="0"/>
          <vertex x="0" y="20" z="0"/>
          <vertex x="0" y="0" z="20"/>
          <vertex x="20" y="0" z="20"/>
          <vertex x="20" y="20" z="20"/>
          <vertex x="0" y="20" z="20"/>
        </vertices>
        <triangles>
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
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>
`,
  "utf8",
);

if (existsSync(out)) {
  rmSync(out, { force: true });
}

execFileSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-Command",
    `Add-Type -AssemblyName System.IO.Compression.FileSystem; if (Test-Path -LiteralPath '${out.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${out.replace(/'/g, "''")}' }; [System.IO.Compression.ZipFile]::CreateFromDirectory('${src.replace(/'/g, "''")}', '${out.replace(/'/g, "''")}')`,
  ],
  { stdio: "inherit" },
);

rmSync(src, { recursive: true, force: true });
console.log(`wrote ${out}`);
