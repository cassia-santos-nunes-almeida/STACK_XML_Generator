// Exports every template (with at least one part) to Moodle XML files.
// Used by the A8 release gate and for behavioural verification:
//   node scripts/export-templates.mjs <outDir>
// Deterministic: XML emission never evaluates random values into the output.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../src/templates/index.js';
import { generateStackXML } from '../src/generators/xml-generator.js';

const outDir = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..', 'exports');
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const [key, tpl] of Object.entries(TEMPLATES)) {
    if (!tpl.parts || tpl.parts.length === 0) continue; // blank template is not exportable
    const xml = generateStackXML(tpl);
    writeFileSync(join(outDir, `${key}.xml`), xml, 'utf8');
    count++;
}
console.log(`Exported ${count} templates to ${outDir}`);
