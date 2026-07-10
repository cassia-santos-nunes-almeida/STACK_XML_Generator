// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { generateStackXML } from '../../generators/xml-generator.js';
import { parseStackXML } from '../../parsers/xml-parser.js';

// Canonical test data for roundtrip testing
const numericalData = {
    name: 'Roundtrip Numerical',
    questionText: 'Calculate \\({@ta1@}\\).',
    variables: [
        { name: 'a', type: 'rand', value: 'rand(10)+1' },
        { name: 'ta1', type: 'calc', value: 'a * 2' },
    ],
    parts: [{
        id: 1,
        type: 'numerical',
        text: 'Your answer:',
        answer: 'ans1',
        teacherAnswer: 'ta1',
        grading: {
            tightTol: 0.05, wideTol: 0.20,
            checkSigFigs: true, sigFigs: 3, penalty: 0.1,
            checkPowerOf10: false, powerOf10Penalty: 0,
        },
        options: [], graphCode: '', gradingCode: '', feedback: {},
    }],
    images: [],
    generalFeedback: 'The answer is {@ta1@}.',
    hints: ['Think carefully.'],
};

function roundtrip(data) {
    const xml = generateStackXML(data);
    return parseStackXML(xml);
}

describe('Roundtrip: Numerical', () => {
    it('preserves question name', () => {
        const result = roundtrip(numericalData);
        expect(result.name).toBe('Roundtrip Numerical');
    });

    it('preserves variables', () => {
        const result = roundtrip(numericalData);
        const varNames = result.variables.map(v => v.name);
        expect(varNames).toContain('a');
        expect(varNames).toContain('ta1');
    });

    it('recovers teacherAnswer from <tans> (A2)', () => {
        const result = roundtrip(numericalData);
        expect(result.parts[0].teacherAnswer).toBe('ta1');
        expect(result.importNotices).toBeUndefined();
    });

    it('preserves part type and answer', () => {
        const result = roundtrip(numericalData);
        expect(result.parts.length).toBe(1);
        expect(result.parts[0].type).toBe('numerical');
        expect(result.parts[0].answer).toBe('ans1');
    });

    it('preserves grading tolerances', () => {
        const result = roundtrip(numericalData);
        expect(result.parts[0].grading.wideTol).toBe(0.2);
        expect(result.parts[0].grading.tightTol).toBe(0.05);
    });

    it('preserves general feedback', () => {
        const result = roundtrip(numericalData);
        expect(result.generalFeedback).toContain('The answer is {@ta1@}.');
    });

    it('preserves hints', () => {
        const result = roundtrip(numericalData);
        expect(result.hints.length).toBeGreaterThanOrEqual(1);
        expect(result.hints[0]).toContain('Think carefully.');
    });
});

describe('Roundtrip: byte stability + legacy healing (A1)', () => {
    it('export -> import -> export is byte-stable', () => {
        const xml1 = generateStackXML(numericalData);
        const xml2 = generateStackXML(parseStackXML(xml1));
        expect(xml2).toBe(xml1);
    });

    it('emits no AT-prefixed answertest names', () => {
        const xml = generateStackXML(numericalData);
        const tests = [...xml.matchAll(/<answertest>([^<]*)<\/answertest>/g)].map(m => m[1]);
        expect(tests.length).toBeGreaterThan(0);
        tests.forEach(t => expect(t).not.toMatch(/^AT/));
    });

    it('heals legacy AT-prefixed exports on import (grading recovered)', () => {
        const legacyXml = generateStackXML(numericalData)
            .replaceAll('<answertest>NumAbsolute</answertest>', '<answertest>ATNumAbs</answertest>')
            .replaceAll('<answertest>NumSigFigs</answertest>', '<answertest>ATNumSigFigs</answertest>');
        const result = parseStackXML(legacyXml);
        expect(result.parts[0].grading.wideTol).toBe(0.2);
        expect(result.parts[0].grading.tightTol).toBe(0.05);
        expect(result.parts[0].grading.checkSigFigs).toBe(true);
        // Re-export of a healed import carries only canonical names
        const healed = generateStackXML(result);
        expect(healed).not.toContain('ATNumAbs');
        expect(healed).not.toContain('ATNumSigFigs');
    });
});

describe('Roundtrip: relative-tolerance house shape (A11)', () => {
    const relData = {
        ...numericalData,
        name: 'Relative Roundtrip',
        parts: [{
            ...numericalData.parts[0],
            grading: {
                ...numericalData.parts[0].grading,
                tolType: 'relative', wideTol: 0.15, checkPowerOf10: true,
            },
        }],
    };

    it('recovers tolType and the sticky signFlip decision', () => {
        const result = roundtrip(relData);
        expect(result.parts[0].grading.tolType).toBe('relative');
        expect(result.parts[0].grading.signFlip).toBe(true);
        expect(result.parts[0].grading.checkPowerOf10).toBe(true);
    });

    it('export -> import -> export is byte-stable for the new shape', () => {
        const xml1 = generateStackXML(relData);
        expect(xml1).toContain('NumRelative');
        expect(xml1).toContain('is_sign_flip');
        const xml2 = generateStackXML(parseStackXML(xml1));
        expect(xml2).toBe(xml1);
    });

    it('legacy absolute import stays absolute on re-export (no silent regrade)', () => {
        const absXml = generateStackXML(numericalData); // tolType absent -> absolute
        const result = parseStackXML(absXml);
        expect(result.parts[0].grading.tolType).toBe('absolute');
        const xml2 = generateStackXML(result);
        expect(xml2).toContain('NumAbsolute');
        expect(xml2).not.toContain('NumRelative');
    });
});

describe('Legacy import auto-migration (A2)', () => {
    function legacyXml() {
        // Reconstruct the pre-A2 shape: model answer lives in a variable
        // named like the input, and tans self-references the input.
        return generateStackXML(numericalData)
            .replaceAll('<tans>ta1</tans>', '<tans>ans1</tans>')
            .replaceAll('ta1: a * 2;', 'ans1: a * 2;')
            .replaceAll('{@ta1@}', '{@ans1@}');
    }

    it('renames the colliding variable, rewrites references, sets teacherAnswer', () => {
        const result = parseStackXML(legacyXml());
        const varNames = result.variables.map(v => v.name);
        expect(varNames).toContain('ta1');
        expect(varNames).not.toContain('ans1');
        expect(result.parts[0].teacherAnswer).toBe('ta1');
        expect(result.parts[0].answer).toBe('ans1');
        expect(result.generalFeedback).toContain('{@ta1@}');
    });

    it('returns a plain-language notice', () => {
        const result = parseStackXML(legacyXml());
        expect(result.importNotices).toHaveLength(1);
        expect(result.importNotices[0]).toMatch(/renamed to "ta1"/);
    });

    it('re-export after migration emits no self-comparing tans', () => {
        const result = parseStackXML(legacyXml());
        delete result.importNotices;
        const healed = generateStackXML(result);
        expect(healed).toContain('<sans>ans1</sans>');
        expect(healed).toContain('<tans>ta1</tans>');
        expect(healed).not.toContain('<tans>ans1</tans>');
    });
});

describe('Roundtrip: Numerical with Power-of-10', () => {
    const p10Data = {
        ...numericalData,
        name: 'P10 Test',
        parts: [{
            ...numericalData.parts[0],
            grading: { ...numericalData.parts[0].grading, checkPowerOf10: true },
        }],
    };

    it('recovers checkPowerOf10 = true', () => {
        const result = roundtrip(p10Data);
        expect(result.parts[0].grading.checkPowerOf10).toBe(true);
    });

    it('has no tans_ alias anywhere (A2)', () => {
        const xml = generateStackXML(p10Data);
        expect(xml).not.toContain('tans_');
        const result = roundtrip(p10Data);
        const varNames = result.variables.map(v => v.name);
        expect(varNames).not.toContain('tans_ans1');
    });
});

describe('Roundtrip: Algebraic', () => {
    const algData = {
        ...numericalData,
        name: 'Algebraic Test',
        parts: [{
            ...numericalData.parts[0],
            type: 'algebraic',
            grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
        }],
    };

    it('preserves algebraic type', () => {
        const result = roundtrip(algData);
        expect(result.parts[0].type).toBe('algebraic');
    });
});

describe('Roundtrip: Units', () => {
    const unitsData = {
        ...numericalData,
        name: 'Units Test',
        parts: [{
            ...numericalData.parts[0],
            type: 'units',
        }],
    };

    it('preserves units type', () => {
        const result = roundtrip(unitsData);
        expect(result.parts[0].type).toBe('units');
    });
});

describe('Roundtrip: Radio/MCQ', () => {
    const mcqData = {
        ...numericalData,
        name: 'MCQ Test',
        parts: [{
            id: 1, type: 'radio', text: 'Pick one:', answer: 'ans1',
            options: [
                { value: 'Apple', correct: false },
                { value: 'Banana', correct: true },
                { value: 'Cherry', correct: false },
            ],
            grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
            graphCode: '', gradingCode: '', feedback: {},
        }],
    };

    it('preserves radio type', () => {
        const result = roundtrip(mcqData);
        expect(result.parts[0].type).toBe('radio');
    });

    it('recovers option values', () => {
        const result = roundtrip(mcqData);
        const values = result.parts[0].options.map(o => o.value);
        expect(values).toContain('Apple');
        expect(values).toContain('Banana');
        expect(values).toContain('Cherry');
    });

    it('filters out ta_ helper from variables', () => {
        const result = roundtrip(mcqData);
        const varNames = result.variables.map(v => v.name);
        expect(varNames).not.toContain('ta_ans1');
    });

    it('recovers the correct option from a value tans (A5-prep)', () => {
        const result = roundtrip(mcqData);
        expect(result.parts[0].options.find(o => o.correct)?.value).toBe('Banana');
    });

    it('heals legacy index-based tans on import (X1)', () => {
        const legacy = generateStackXML(mcqData)
            .replace('<tans>&quot;Banana&quot;</tans>', '<tans>2</tans>');
        const healed = parseStackXML(legacy);
        expect(healed.parts[0].options.find(o => o.correct)?.value).toBe('Banana');
        // Re-export carries the canonical value form
        expect(generateStackXML(healed)).toContain('<tans>&quot;Banana&quot;</tans>');
    });
});

describe('Roundtrip: String', () => {
    const strData = {
        ...numericalData,
        name: 'String Test',
        parts: [{
            ...numericalData.parts[0],
            type: 'string',
            grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0, caseSensitive: true },
        }],
    };

    it('preserves string type', () => {
        const result = roundtrip(strData);
        expect(result.parts[0].type).toBe('string');
    });
});

describe('Roundtrip: JSXGraph', () => {
    const jsxData = {
        ...numericalData,
        name: 'JSXGraph Test',
        parts: [{
            id: 1, type: 'jsxgraph', text: 'Draw:', answer: 'ans1', teacherAnswer: 'ta1',
            grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
            options: [],
            graphCode: 'var board = JXG.JSXGraph.initBoard(divid, {axis:true});',
            gradingCode: 'all_correct: true;',
            feedback: {},
        }],
    };

    it('preserves jsxgraph type', () => {
        const result = roundtrip(jsxData);
        expect(result.parts[0].type).toBe('jsxgraph');
    });

    it('recovers grading code', () => {
        const result = roundtrip(jsxData);
        expect(result.parts[0].gradingCode).toContain('all_correct');
    });
});

describe('Roundtrip: Multi-part', () => {
    const multiData = {
        ...numericalData,
        name: 'Multi-Part Test',
        parts: [
            {
                id: 1, type: 'numerical', text: 'Part a:', answer: 'ans1', teacherAnswer: 'ta1',
                grading: { tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            },
            {
                id: 2, type: 'algebraic', text: 'Part b:', answer: 'ans2', teacherAnswer: 'ta1',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            },
        ],
    };

    it('preserves multiple parts', () => {
        const result = roundtrip(multiData);
        expect(result.parts.length).toBe(2);
    });

    it('preserves part ordering and types', () => {
        const result = roundtrip(multiData);
        expect(result.parts[0].type).toBe('numerical');
        expect(result.parts[0].answer).toBe('ans1');
        expect(result.parts[1].type).toBe('algebraic');
        expect(result.parts[1].answer).toBe('ans2');
    });
});
