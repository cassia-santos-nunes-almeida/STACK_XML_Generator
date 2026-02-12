// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { generateStackXML } from '../../generators/xml-generator.js';
import { parseStackXML } from '../../parsers/xml-parser.js';

// Canonical test data for roundtrip testing
const numericalData = {
    name: 'Roundtrip Numerical',
    questionText: 'Calculate \\({@ans1@}\\).',
    variables: [
        { name: 'a', type: 'rand', value: 'rand(10)+1' },
        { name: 'ans1', type: 'calc', value: 'a * 2' },
    ],
    parts: [{
        id: 1,
        type: 'numerical',
        text: 'Your answer:',
        answer: 'ans1',
        grading: {
            tightTol: 0.05, wideTol: 0.20,
            checkSigFigs: true, sigFigs: 3, penalty: 0.1,
            checkPowerOf10: false, powerOf10Penalty: 0,
        },
        options: [], graphCode: '', gradingCode: '', feedback: {},
    }],
    images: [],
    generalFeedback: 'The answer is {@ans1@}.',
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
        expect(varNames).toContain('ans1');
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
        expect(result.generalFeedback).toContain('The answer is {@ans1@}.');
    });

    it('preserves hints', () => {
        const result = roundtrip(numericalData);
        expect(result.hints.length).toBeGreaterThanOrEqual(1);
        expect(result.hints[0]).toContain('Think carefully.');
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

    it('filters out tans_ alias from variables', () => {
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
            id: 1, type: 'jsxgraph', text: 'Draw:', answer: 'ans1',
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
                id: 1, type: 'numerical', text: 'Part a:', answer: 'ans1',
                grading: { tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            },
            {
                id: 2, type: 'algebraic', text: 'Part b:', answer: 'ans2',
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
