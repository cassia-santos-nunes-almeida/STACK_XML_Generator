// A2 acceptance — reserved ansN namespace across ALL templates:
// no PRT-node <tans> (and no input <tans>) may equal any input <name>,
// and no questionvariable may WRITE to an input name.
import { describe, it, expect } from 'vitest';
import { generateStackXML } from '../../generators/xml-generator.js';
import { TEMPLATES } from '../../templates/index.js';

function inputNames(xml) {
    return [...xml.matchAll(/<input>\s*<name>([^<]+)<\/name>/g)].map(m => m[1]);
}

describe('A2: no template compares an input against itself', () => {
    for (const [key, tpl] of Object.entries(TEMPLATES)) {
        if (!tpl.parts || tpl.parts.length === 0) continue;

        it(`template "${key}": no <tans> equals an input name`, () => {
            const xml = generateStackXML(tpl);
            const inputs = new Set(inputNames(xml));
            expect(inputs.size).toBeGreaterThan(0);
            const tansValues = [...xml.matchAll(/<tans>([^<]*)<\/tans>/g)].map(m => m[1].trim());
            for (const t of tansValues) {
                expect(inputs.has(t), `<tans>${t}</tans> self-compares an input in "${key}"`).toBe(false);
            }
        });

        it(`template "${key}": questionvariables never write to an input name`, () => {
            const xml = generateStackXML(tpl);
            const inputs = inputNames(xml);
            const qv = xml.match(/<questionvariables>\s*<text><!\[CDATA\[([\s\S]*?)\]\]><\/text>/)?.[1] || '';
            for (const name of inputs) {
                const writeRe = new RegExp(`(^|[;\\n])\\s*${name}\\s*:`, 'm');
                expect(writeRe.test(qv), `questionvariables writes to input "${name}" in "${key}"`).toBe(false);
            }
        });
    }
});
