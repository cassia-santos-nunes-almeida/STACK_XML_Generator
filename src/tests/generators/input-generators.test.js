import { describe, it, expect } from 'vitest';
import { generateNumericalInput } from '../../generators/inputs/numerical-input.js';
import { generateAlgebraicInput } from '../../generators/inputs/algebraic-input.js';
import { generateUnitsInput } from '../../generators/inputs/units-input.js';
import { generateRadioInput, generateRadioVariable } from '../../generators/inputs/radio-input.js';
import { generateMatrixInput } from '../../generators/inputs/matrix-input.js';
import { generateStringInput } from '../../generators/inputs/string-input.js';
import { generateJSXGraphInput } from '../../generators/inputs/jsxgraph-input.js';
import { generateInput } from '../../generators/inputs/input-factory.js';

const basePart = {
    answer: 'ans1',
    type: 'numerical',
    grading: {},
    options: [],
    graphCode: '',
    gradingCode: '',
    feedback: {},
};

describe('Numerical Input', () => {
    const part = { ...basePart, type: 'numerical' };

    it('emits correct type', () => {
        const xml = generateNumericalInput(part);
        expect(xml).toContain('<type>numerical</type>');
    });

    it('uses answer variable for name and tans', () => {
        const xml = generateNumericalInput(part);
        expect(xml).toContain('<name>ans1</name>');
        expect(xml).toContain('<tans>ans1</tans>');
    });

    it('allows floats (forbidfloat=0)', () => {
        const xml = generateNumericalInput(part);
        expect(xml).toContain('<forbidfloat>0</forbidfloat>');
    });
});

describe('Algebraic Input', () => {
    const part = { ...basePart, type: 'algebraic' };

    it('emits correct type', () => {
        const xml = generateAlgebraicInput(part);
        expect(xml).toContain('<type>algebraic</type>');
    });

    it('forbids floats (forbidfloat=1)', () => {
        const xml = generateAlgebraicInput(part);
        expect(xml).toContain('<forbidfloat>1</forbidfloat>');
    });

    it('uses larger boxsize (20)', () => {
        const xml = generateAlgebraicInput(part);
        expect(xml).toContain('<boxsize>20</boxsize>');
    });
});

describe('Units Input', () => {
    const part = { ...basePart, type: 'units' };

    it('emits correct type', () => {
        const xml = generateUnitsInput(part);
        expect(xml).toContain('<type>units</type>');
    });

    it('enables insertstars for implicit multiplication', () => {
        const xml = generateUnitsInput(part);
        expect(xml).toContain('<insertstars>1</insertstars>');
    });

    it('uses answer variable for tans', () => {
        const xml = generateUnitsInput(part);
        expect(xml).toContain('<tans>ans1</tans>');
    });
});

describe('Radio Input', () => {
    const part = {
        ...basePart,
        type: 'radio',
        answer: 'ans1',
        options: [
            { value: 'Apple', correct: false },
            { value: 'Banana', correct: true },
        ],
    };

    it('emits correct type', () => {
        const xml = generateRadioInput(part);
        expect(xml).toContain('<type>radio</type>');
    });

    it('uses ta_ prefixed variable for tans', () => {
        const xml = generateRadioInput(part);
        expect(xml).toContain('<tans>ta_ans1</tans>');
    });

    it('hides validation (mustverify=0, showvalidation=0)', () => {
        const xml = generateRadioInput(part);
        expect(xml).toContain('<mustverify>0</mustverify>');
        expect(xml).toContain('<showvalidation>0</showvalidation>');
    });

    it('generates correct Maxima list for radio variable', () => {
        const varDef = generateRadioVariable(part);
        expect(varDef).toContain('ta_ans1');
        expect(varDef).toContain('["Apple", false]');
        expect(varDef).toContain('["Banana", true]');
    });
});

describe('Matrix Input', () => {
    const part = { ...basePart, type: 'matrix' };

    it('emits correct type', () => {
        const xml = generateMatrixInput(part);
        expect(xml).toContain('<type>matrix</type>');
    });

    it('uses boxsize 5', () => {
        const xml = generateMatrixInput(part);
        expect(xml).toContain('<boxsize>5</boxsize>');
    });

    it('forbids floats', () => {
        const xml = generateMatrixInput(part);
        expect(xml).toContain('<forbidfloat>1</forbidfloat>');
    });
});

describe('String Input', () => {
    const part = { ...basePart, type: 'string' };

    it('emits correct type', () => {
        const xml = generateStringInput(part);
        expect(xml).toContain('<type>string</type>');
    });

    it('disables strict syntax', () => {
        const xml = generateStringInput(part);
        expect(xml).toContain('<strictsyntax>0</strictsyntax>');
    });

    it('shows validation (showvalidation=1)', () => {
        const xml = generateStringInput(part);
        expect(xml).toContain('<showvalidation>1</showvalidation>');
    });
});

describe('JSXGraph Input', () => {
    const part = { ...basePart, type: 'jsxgraph' };

    it('emits algebraic type (hidden input for graph)', () => {
        const xml = generateJSXGraphInput(part);
        expect(xml).toContain('<type>algebraic</type>');
    });

    it('hides validation (mustverify=0, showvalidation=0)', () => {
        const xml = generateJSXGraphInput(part);
        expect(xml).toContain('<mustverify>0</mustverify>');
        expect(xml).toContain('<showvalidation>0</showvalidation>');
    });

    it('disables strict syntax', () => {
        const xml = generateJSXGraphInput(part);
        expect(xml).toContain('<strictsyntax>0</strictsyntax>');
    });

    it('hides teacher answer with hideanswer option', () => {
        const xml = generateJSXGraphInput(part);
        expect(xml).toContain('<options>hideanswer</options>');
    });
});

describe('Input Factory', () => {
    it('dispatches numerical type correctly', () => {
        const part = { ...basePart, type: 'numerical' };
        const xml = generateInput(part);
        expect(xml).toContain('<type>numerical</type>');
    });

    it('dispatches radio type correctly', () => {
        const part = {
            ...basePart,
            type: 'radio',
            options: [{ value: 'A', correct: true }],
        };
        const xml = generateInput(part);
        expect(xml).toContain('<type>radio</type>');
    });

    it('falls back to algebraic for unknown type', () => {
        const part = { ...basePart, type: 'unknown_type' };
        const xml = generateInput(part);
        expect(xml).toContain('<type>algebraic</type>');
    });
});
