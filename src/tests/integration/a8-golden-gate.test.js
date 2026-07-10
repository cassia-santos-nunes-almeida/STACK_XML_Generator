// A8 release gate — golden fixtures. The 14 template exports committed at
// the gate run are the exact bytes the owner's real-Moodle import test pack
// covers. If generator output changes, this test fails with the required
// message: the gate is STALE and the Moodle import must be re-run (then the
// fixtures re-committed via `node scripts/export-templates.mjs
// src/tests/fixtures/golden`).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../../templates/index.js';
import { generateStackXML } from '../../generators/xml-generator.js';

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'golden');

describe('A8: golden-fixture gate', () => {
    const exportable = Object.entries(TEMPLATES).filter(([, t]) => t.parts && t.parts.length > 0);

    it('has one committed fixture per exportable template', () => {
        const files = readdirSync(goldenDir).filter(f => f.endsWith('.xml')).map(f => f.replace(/\.xml$/, ''));
        expect(files.sort()).toEqual(exportable.map(([k]) => k).sort());
    });

    exportable.forEach(([key, tpl]) => {
        it(`${key}: generator output matches the gate fixture`, () => {
            const golden = readFileSync(join(goldenDir, `${key}.xml`), 'utf8');
            const current = generateStackXML(tpl);
            expect(current, `GATE STALE for ${key} — generator output changed since the last release gate. Re-run the real-Moodle import (docs/a8-gate-log.md) and refresh the fixtures.`).toBe(golden);
        });
    });
});
