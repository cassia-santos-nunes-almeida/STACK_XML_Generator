// A6 — blocking validate-before-export: stable error codes, stack-rules.json
// (X2) as the single rule source, Maxima lint with the A3 lookbehind corpus,
// questionnote distinctness, and the generator-invariant fixture corpus
// (all templates must export with zero errors).
import { describe, it, expect } from 'vitest';
import {
    validateQuestionData,
    validateVariableName,
    checkVariableName,
    lintMaximaValue,
} from '../../core/validators.js';
import { questionNoteMayBeConstant } from '../../generators/question-note.js';
import { TEMPLATES } from '../../templates/index.js';
import STACK_RULES from '../../core/stack-rules.json' with { type: 'json' };

const baseData = {
    name: 'T', questionText: 'Q',
    variables: [{ name: 'ta1', type: 'calc', value: '42' }],
    parts: [{
        id: 1, type: 'numerical', text: 'A:', answer: 'ans1', teacherAnswer: 'ta1',
        grading: { tolType: 'absolute', tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
        options: [], graphCode: '', gradingCode: '', feedback: {},
    }],
    images: [], generalFeedback: '', hints: [],
};

describe('A6: stable error codes', () => {
    it('every issue carries a stable code', () => {
        const issues = validateQuestionData({ ...baseData, name: '', parts: [] });
        expect(issues.length).toBeGreaterThan(0);
        issues.forEach(i => expect(i.code, i.message).toMatch(/^[EW]-[A-Z]+-\d\d$/));
    });

    it('ansN-reserved variable names block with E-VAR-04', () => {
        const issues = validateQuestionData({
            ...baseData,
            variables: [...baseData.variables, { name: 'ans2', type: 'calc', value: '1' }],
        });
        expect(issues.some(i => i.code === 'E-VAR-04' && i.level === 'error')).toBe(true);
    });
});

describe('A6: variable-name rules come from stack-rules.json (X2)', () => {
    it('enforces the input-name character cap', () => {
        const long = 'a'.repeat(STACK_RULES.inputNameMaxLength + 1);
        const res = checkVariableName(long);
        expect(res.code).toBe('E-VAR-03');
        expect(res.message).toContain(String(STACK_RULES.inputNameMaxLength));
    });

    it('enforces the STACK name regex (no leading/trailing underscore)', () => {
        expect(checkVariableName('_x').code).toBe('E-VAR-01');
        expect(checkVariableName('x_').code).toBe('E-VAR-01');
        expect(checkVariableName('v_val')).toBeNull();
    });

    it('keeps the legacy string API working', () => {
        expect(validateVariableName('my_var')).toBeNull();
        expect(validateVariableName('if')).toContain('reserved');
    });
});

describe('A6: Maxima lint (A3 lookbehind corpus)', () => {
    const none = new Set();
    it('flags bare pi but not %pi / pin / api (rider corpus)', () => {
        expect(lintMaximaValue('%pi / 4', none)).toHaveLength(0);
        expect(lintMaximaValue('pin + api', none)).toHaveLength(0);
        expect(lintMaximaValue('pi / 4', none).some(f => f.code === 'E-MAX-02')).toBe(true);
        expect(lintMaximaValue('2*pi*f', none).some(f => f.code === 'E-MAX-02')).toBe(true);
        expect(lintMaximaValue('theta * %pi / 180', none)).toHaveLength(0);
    });

    it('does not flag pi when the author defined a variable named pi', () => {
        expect(lintMaximaValue('pi / 4', new Set(['pi']))).toHaveLength(0);
    });

    it('warns on standalone e but not exp()/scientific notation/%e', () => {
        expect(lintMaximaValue('2*e', none).some(f => f.code === 'W-MAX-03')).toBe(true);
        expect(lintMaximaValue('exp(x)', none)).toHaveLength(0);
        expect(lintMaximaValue('2.5e-3', none)).toHaveLength(0);
        expect(lintMaximaValue('%e^x', none)).toHaveLength(0);
        expect(lintMaximaValue('2*e', new Set(['e']))).toHaveLength(0);
    });

    it('is scoped to Maxima fields: strings and comments are stripped', () => {
        expect(lintMaximaValue('"the pi symbol"', none)).toHaveLength(0);
        expect(lintMaximaValue('/* pi here */ 4', none)).toHaveLength(0);
    });

    it('bare pi in a variable value blocks export via validateQuestionData', () => {
        const issues = validateQuestionData({
            ...baseData,
            variables: [{ name: 'ta1', type: 'calc', value: '2*pi*10' }],
        });
        expect(issues.some(i => i.code === 'E-MAX-02' && i.level === 'error')).toBe(true);
    });
});

describe('A6: questionnote distinctness (A5 rider)', () => {
    it('rand-variable templates produce distinct notes', () => {
        expect(questionNoteMayBeConstant(TEMPLATES.projectile)).toBe(false);
    });

    it('a non-randomised question is exempt', () => {
        expect(questionNoteMayBeConstant(baseData)).toBe(false);
    });

    it('constant "rand" variables are flagged as constant', () => {
        expect(questionNoteMayBeConstant(TEMPLATES.jsxgraph_connect)).toBe(true);
    });

    it('surfaces as a warning (never a blocker) in validateQuestionData', () => {
        const issues = validateQuestionData(TEMPLATES.jsxgraph_connect);
        const note = issues.find(i => i.code === 'W-NOTE-01');
        expect(note).toBeTruthy();
        expect(note.level).toBe('warning');
    });
});

describe('A6: units teacher answers should be stackunits-wrapped', () => {
    it('warns when a units part answer variable is unitless', () => {
        const issues = validateQuestionData({
            ...baseData,
            variables: [{ name: 'ta1', type: 'calc', value: '42' }],
            parts: [{ ...baseData.parts[0], type: 'units' }],
        });
        expect(issues.some(i => i.code === 'W-UNITS-01')).toBe(true);
    });

    it('does not warn for stackunits answers', () => {
        const issues = validateQuestionData({
            ...baseData,
            variables: [{ name: 'ta1', type: 'algebraic', value: 'stackunits(42, m/s)' }],
            parts: [{ ...baseData.parts[0], type: 'units' }],
        });
        expect(issues.some(i => i.code === 'W-UNITS-01')).toBe(false);
    });
});

describe('A6: fixture corpus — every template exports with zero errors', () => {
    Object.entries(TEMPLATES).forEach(([key, tpl]) => {
        if (!tpl.parts || tpl.parts.length === 0) return;
        it(`${key} has no blocking issues`, () => {
            const errors = validateQuestionData(tpl).filter(i => i.level === 'error');
            expect(errors, JSON.stringify(errors)).toHaveLength(0);
        });
    });
});
