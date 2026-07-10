// A6(b) — generator-invariant checks live in Vitest, NOT in runtime code
// (post-A1/A2 they are unreachable through the UI = runtime theater).
// Answertest whitelist: answertest-whitelist.test.js (A1/X2).
// Qtest shape: qtest-generator.test.js (A5).
// Here: input/[[validation]] pairing over every generated template export.
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../../templates/index.js';
import { generateStackXML } from '../../generators/xml-generator.js';

describe('A6: input/validation pairing invariant', () => {
    Object.entries(TEMPLATES).forEach(([key, tpl]) => {
        if (!tpl.parts || tpl.parts.length === 0) return;
        it(`${key}: every input is placed and (non-notes) validated in the question text`, () => {
            const xml = generateStackXML(tpl);
            const inputNames = [...xml.matchAll(/<input>\s*<name>([^<]+)<\/name>/g)].map(m => m[1]);
            expect(inputNames.length).toBe(tpl.parts.length);
            const qtext = xml.match(/<questiontext format="html">\s*<text><!\[CDATA\[([\s\S]*?)\]\]><\/text>/)[1];
            tpl.parts.forEach(p => {
                expect(qtext, `${key}: [[input:${p.answer}]] missing`).toContain(`[[input:${p.answer}]]`);
                if (p.type !== 'notes') {
                    expect(qtext, `${key}: [[validation:${p.answer}]] missing`).toContain(`[[validation:${p.answer}]]`);
                }
            });
        });
    });
});
