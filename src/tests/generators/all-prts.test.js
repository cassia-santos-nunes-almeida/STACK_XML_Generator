import { describe, it, expect } from 'vitest';
import { generateAlgebraicPRT } from '../../generators/prts/algebraic-prt.js';
import { generateMatrixPRT } from '../../generators/prts/matrix-prt.js';
import { generateStringPRT } from '../../generators/prts/string-prt.js';
import { generateJSXGraphPRT } from '../../generators/prts/jsxgraph-prt.js';

describe('Algebraic PRT', () => {
    it('uses AlgEquiv test', () => {
        const xml = generateAlgebraicPRT({ answer: 'ans1', feedback: {} }, 'prt1');
        expect(xml).toContain('<answertest>AlgEquiv</answertest>');
    });

    it('has single node (0)', () => {
        const xml = generateAlgebraicPRT({ answer: 'ans1', feedback: {} }, 'prt1');
        expect(xml).toContain('<name>0</name>');
        expect(xml).not.toContain('<name>1</name>');
    });
});

describe('Matrix PRT', () => {
    it('uses AlgEquiv for matrix comparison', () => {
        const xml = generateMatrixPRT({ answer: 'ans1', feedback: {} }, 'prt1');
        expect(xml).toContain('<answertest>AlgEquiv</answertest>');
    });
});

describe('String PRT', () => {
    it('uses String test for case-sensitive matching', () => {
        const xml = generateStringPRT({
            answer: 'ans1',
            grading: { caseSensitive: true },
            feedback: {},
        }, 'prt1');
        expect(xml).toContain('<answertest>String</answertest>');
    });

    it('uses StringSloppy for case-insensitive matching', () => {
        const xml = generateStringPRT({
            answer: 'ans1',
            grading: { caseSensitive: false },
            feedback: {},
        }, 'prt1');
        expect(xml).toContain('<answertest>StringSloppy</answertest>');
    });
});

describe('JSXGraph PRT', () => {
    it('includes feedbackvariables with grading code', () => {
        const xml = generateJSXGraphPRT({
            answer: 'ans1',
            gradingCode: 'all_correct: is(ans1 = expected);',
            feedback: {},
        }, 'prt1');

        expect(xml).toContain('<feedbackvariables>');
        expect(xml).toContain('all_correct: is(ans1 = expected);');
    });

    it('checks all_correct variable', () => {
        const xml = generateJSXGraphPRT({
            answer: 'ans1',
            gradingCode: 'all_correct: true;',
            feedback: {},
        }, 'prt1');

        expect(xml).toContain('<sans>all_correct</sans>');
        expect(xml).toContain('<tans>true</tans>');
    });

    it('defaults grading code when empty', () => {
        const xml = generateJSXGraphPRT({
            answer: 'ans1',
            gradingCode: '',
            feedback: {},
        }, 'prt1');

        expect(xml).toContain('all_correct: true;');
    });
});
