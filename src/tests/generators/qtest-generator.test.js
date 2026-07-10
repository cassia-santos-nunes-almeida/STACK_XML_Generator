// @vitest-environment jsdom
// A5 — canonical qtests + deployed seeds. Expectations must be DERIVED from
// the emitted PRT node graph (never hardcoded strings), so these tests
// cross-check every expected answernote against the node notes actually
// present in the same export.
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../../templates/index.js';
import { generateStackXML } from '../../generators/xml-generator.js';
import { parseStackXML } from '../../parsers/xml-parser.js';

const JSXGRAPH_TEMPLATES = new Set(['jsxgraph_connect', 'jsxgraph_sketch', 'jsxgraph_vector']);

function exportable() {
    return Object.entries(TEMPLATES).filter(([, t]) => t.parts && t.parts.length > 0);
}

function qtestsOf(xml) {
    return [...xml.matchAll(/<qtest>([\s\S]*?)<\/qtest>/g)].map(m => m[1]);
}

function expectedOf(qtest, prtName) {
    const m = qtest.match(new RegExp(
        `<expected>\\s*<name>${prtName}</name>\\s*<expectedscore>([^<]*)</expectedscore>\\s*(<expectedpenalty>[^<]*</expectedpenalty>|<expectedpenalty/>)\\s*<expectedanswernote>([^<]*)</expectedanswernote>\\s*</expected>`));
    return m ? { score: m[1], penalty: m[2], note: m[3] } : null;
}

function prtBlockOf(xml, prtName) {
    const m = xml.match(new RegExp(`<prt>\\s*<name>${prtName}</name>([\\s\\S]*?)</prt>`));
    return m ? m[1] : '';
}

function nodeNotesOf(prtBlock) {
    return [
        ...[...prtBlock.matchAll(/<trueanswernote>([^<]*)<\/trueanswernote>/g)].map(m => m[1]),
        ...[...prtBlock.matchAll(/<falseanswernote>([^<]*)<\/falseanswernote>/g)].map(m => m[1]),
    ];
}

describe('A5: qtest shape (Tier-4 schema)', () => {
    it('every exportable template emits at least one qtest', () => {
        exportable().forEach(([key, tpl]) => {
            const xml = generateStackXML(tpl);
            expect(qtestsOf(xml).length, `${key} has no qtests`).toBeGreaterThanOrEqual(1);
        });
    });

    it('qtest children are only testcase/description/testinput/expected, nothing <text>-wrapped', () => {
        exportable().forEach(([key, tpl]) => {
            const xml = generateStackXML(tpl);
            qtestsOf(xml).forEach(qt => {
                expect(qt, `${key}: <text> inside <qtest>`).not.toContain('<text>');
                const children = [...qt.matchAll(/<(\w+)[/>]/g)].map(m => m[1]);
                const allowed = new Set(['testcase', 'description', 'testinput', 'expected',
                    'name', 'value', 'expectedscore', 'expectedpenalty', 'expectedanswernote']);
                children.forEach(c => expect(allowed.has(c), `${key}: unexpected <${c}> in qtest`).toBe(true));
            });
        });
    });

    it('testcase numbers are sequential from 1', () => {
        exportable().forEach(([, tpl]) => {
            const xml = generateStackXML(tpl);
            const cases = [...xml.matchAll(/<testcase>(\d+)<\/testcase>/g)].map(m => parseInt(m[1]));
            cases.forEach((c, i) => expect(c).toBe(i + 1));
        });
    });

    it('the model qtest covers every input and every PRT', () => {
        exportable().forEach(([key, tpl]) => {
            const xml = generateStackXML(tpl);
            const model = qtestsOf(xml)[0];
            expect(model).toContain('Model answer earns full marks.');
            tpl.parts.forEach(p => {
                expect(model, `${key}: missing testinput ${p.answer}`).toContain(`<name>${p.answer}</name>`);
                expect(expectedOf(model, `prt${p.id}`), `${key}: missing expected prt${p.id}`).toBeTruthy();
            });
        });
    });

    it('every expected answernote names a real node note of its PRT (walk-derived)', () => {
        exportable().forEach(([key, tpl]) => {
            const xml = generateStackXML(tpl);
            qtestsOf(xml).forEach(qt => {
                [...qt.matchAll(/<expected>\s*<name>(prt\d+)<\/name>[\s\S]*?<expectedanswernote>([^<]*)<\/expectedanswernote>/g)]
                    .forEach(([, prtName, note]) => {
                        const notes = nodeNotesOf(prtBlockOf(xml, prtName));
                        expect(notes, `${key}: ${prtName} note ${note} not in graph`).toContain(note);
                    });
            });
        });
    });
});

describe('A5: canonical pair (model full marks + specific wrong branch)', () => {
    it('all non-jsxgraph templates emit >= 2 qtests (the canonical pair)', () => {
        exportable().forEach(([key, tpl]) => {
            const n = qtestsOf(generateStackXML(tpl)).length;
            if (JSXGRAPH_TEMPLATES.has(key)) {
                expect(n, `${key}`).toBe(1); // documented limitation: CAS-opaque grading code
            } else {
                expect(n, `${key} lacks the wrong-answer qtest`).toBeGreaterThanOrEqual(2);
            }
        });
    });

    it('projectile model answer earns full marks at the sig-figs node', () => {
        const xml = generateStackXML(TEMPLATES.projectile);
        const model = qtestsOf(xml)[0];
        expect(model).toContain('<value>significantfigures(ta1, 3)</value>');
        const exp = expectedOf(model, 'prt1');
        expect(exp.score).toBe('1.0000000');
        // The full-marks note must be the sig-figs node's TRUE note, read
        // from the emitted graph, not assumed.
        const prt1 = prtBlockOf(xml, 'prt1');
        const sigNode = prt1.match(/<node>\s*<name>(\d+)<\/name>\s*<answertest>NumSigFigs<\/answertest>[\s\S]*?<trueanswernote>([^<]*)<\/trueanswernote>/);
        expect(exp.note).toBe(sigNode[2]);
    });

    it('projectile sign-flipped answer lands on the sign-flip branch at 0.5', () => {
        const xml = generateStackXML(TEMPLATES.projectile);
        const distractorQt = qtestsOf(xml).find(qt => qt.includes('ev(-(ta1), simp)'));
        expect(distractorQt).toBeTruthy();
        const exp = expectedOf(distractorQt, 'prt1');
        expect(exp.score).toBe('0.5000000');
        const prt1 = prtBlockOf(xml, 'prt1');
        const sfNode = prt1.match(/<sans>is_sign_flip<\/sans>[\s\S]*?<trueanswernote>([^<]*)<\/trueanswernote>/);
        expect(exp.note).toBe(sfNode[1]);
    });

    it('kinematics units distractor fails the units node outright', () => {
        const xml = generateStackXML(TEMPLATES.kinematics);
        const qt = qtestsOf(xml).find(q => q.includes('stackunits(-v_val, m/s)'));
        expect(qt).toBeTruthy();
        const exp = expectedOf(qt, 'prt1');
        expect(exp.score).toBe('0.0000000');
        expect(exp.note).toBe('prt1-0-F');
    });

    it('mcq distractor is a wrong option value', () => {
        const xml = generateStackXML(TEMPLATES.mcq_primes);
        const qt = qtestsOf(xml).find(q => q.includes('&quot;4&quot;'));
        expect(qt).toBeTruthy();
        expect(expectedOf(qt, 'prt1').score).toBe('0.0000000');
    });

    it('show_reasoning distractor trips the prerequisite gate downstream', () => {
        const xml = generateStackXML(TEMPLATES.show_reasoning);
        const qt = qtestsOf(xml).find(q => q.includes('ev(-(ta1), simp)'));
        expect(qt).toBeTruthy();
        const exp3 = expectedOf(qt, 'prt3');
        expect(exp3.note).toBe('prt3-prereq-F');
        expect(exp3.score).toBe('0.0000000');
    });

    it('distractor qtests never award full marks (rider: distractor vs tolerance, x3 runs)', () => {
        for (let run = 0; run < 3; run++) {
            exportable().forEach(([key, tpl]) => {
                const xml = generateStackXML(tpl);
                const qts = qtestsOf(xml);
                qts.slice(1).forEach(qt => {
                    tpl.parts.forEach(p => {
                        const hasDistractorInput = qt.includes('Wrong answer') &&
                            (p.distractor ? qt.includes(escapeForContains(p.distractor)) : false);
                        if (hasDistractorInput) {
                            const exp = expectedOf(qt, `prt${p.id}`);
                            expect(parseFloat(exp.score), `${key} prt${p.id} run ${run}`).toBeLessThan(1);
                        }
                    });
                });
            });
        }
    });
});

function escapeForContains(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

describe('A5: implied-multiplication pin (D4 rider)', () => {
    ['algebra_expansion', 'diff_equation'].forEach(key => {
        it(`${key} pins insertstars=1 with a 2x qtest graded on the false branch`, () => {
            const xml = generateStackXML(TEMPLATES[key]);
            expect(xml).toContain('<insertstars>1</insertstars>');
            const pin = qtestsOf(xml).find(q => q.includes('<value>2x</value>'));
            expect(pin).toBeTruthy();
            const exp = expectedOf(pin, 'prt1');
            expect(exp.score).toBe('0.0000000');
            expect(exp.note).toBe('prt1-0-F');
        });
    });
});

describe('A5: deployed seeds', () => {
    it('rand-variable questions carry exactly 3 seeds by default', () => {
        const xml = generateStackXML(TEMPLATES.projectile);
        expect([...xml.matchAll(/<deployedseed>/g)].length).toBe(3);
    });

    it('MCQ-only questions are randomised too (random_permutation) and get seeds', () => {
        const xml = generateStackXML(TEMPLATES.mcq_primes);
        expect([...xml.matchAll(/<deployedseed>/g)].length).toBe(3);
    });

    it('non-randomised questions get no seeds', () => {
        const data = {
            name: 'Static', questionText: 'Q {@ta1@}',
            variables: [{ name: 'ta1', type: 'calc', value: '42' }],
            parts: [{
                id: 1, type: 'numerical', text: 'A:', answer: 'ans1', teacherAnswer: 'ta1',
                grading: { tolType: 'absolute', tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            }],
            images: [], generalFeedback: '', hints: [],
        };
        const xml = generateStackXML(data);
        expect(xml).not.toContain('<deployedseed>');
        // ... but still emits the canonical qtest pair
        expect(qtestsOf(xml).length).toBeGreaterThanOrEqual(2);
    });
});

describe('A5 (X1): roundtrip preserves seeds and distractors', () => {
    it('projectile export -> import recovers seeds and the auto distractor', () => {
        const xml = generateStackXML(TEMPLATES.projectile);
        const state = parseStackXML(xml);
        expect(state.deployedSeeds).toEqual([12345, 10101, 10102]);
        expect(state.parts[0].distractor).toBe('ev(-(ta1), simp)');
    });

    it('export -> import -> export is byte-stable with qtests present', () => {
        ['projectile', 'kinematics', 'mcq_primes', 'show_reasoning', 'algebra_expansion'].forEach(key => {
            const xml1 = generateStackXML(TEMPLATES[key]);
            const xml2 = generateStackXML(parseStackXML(xml1));
            expect(xml2, `${key} roundtrip not byte-stable`).toBe(xml1);
        });
    });

    it('imported custom seed sets are preserved on re-export', () => {
        const xml = generateStackXML(TEMPLATES.projectile)
            .replace('<deployedseed>12345</deployedseed>', '<deployedseed>777</deployedseed>');
        const state = parseStackXML(xml);
        expect(state.deployedSeeds).toEqual([777, 10101, 10102]);
        expect(generateStackXML(state)).toContain('<deployedseed>777</deployedseed>');
    });
});
