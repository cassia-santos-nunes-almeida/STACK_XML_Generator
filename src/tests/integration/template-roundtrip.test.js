// @vitest-environment jsdom
// Whole-corpus roundtrip gauntlet (F4-prep): EVERY template must survive
// export -> import -> export byte-identically. This is what exposed two
// silent import corruptions the 5-template sample missed:
//   1. jsxgraph graphCode recovered via innerHTML (&& -> &amp;&amp;) and the
//      boundp helper tail re-appended on every cycle;
//   2. rand-typed constant variables (jsxgraph_connect t1..t4) degrading to
//      calc on import, dropping the questionnote entries and deployed seeds.
import { it, expect, describe } from 'vitest';
import { generateStackXML } from '../../generators/xml-generator.js';
import { parseStackXML } from '../../parsers/xml-parser.js';
import { TEMPLATES } from '../../templates/index.js';

describe('all-templates roundtrip byte stability', () => {
    Object.entries(TEMPLATES).forEach(([key, tpl]) => {
        it(`${key}: export -> import -> export is byte-stable`, () => {
            const xml1 = generateStackXML(tpl);
            const xml2 = generateStackXML(parseStackXML(xml1));
            if (key === 'matrix_operations') {
                // Known HTML-serialization exception: the LaTeX pmatrix "&"
                // in the question text serializes as "&amp;" after an
                // import (innerHTML) — HTML-equivalent in Moodle. The only
                // drift allowed is that entity, and the SECOND cycle must be
                // an exact fixed point.
                expect(xml2.replace(/&amp;/g, '&')).toBe(xml1);
                const xml3 = generateStackXML(parseStackXML(xml2));
                expect(xml3).toBe(xml2);
                return;
            }
            expect(xml2, `${key} roundtrip not byte-stable`).toBe(xml1);
        });
    });
});
