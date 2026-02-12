import { describe, it, expect } from 'vitest';
import {
    validateVariableReferences,
    extractVariableRefs,
    validateMaximaExpression,
    validateVariableName,
    validateQuestionData,
} from '../../core/validators.js';

describe('Validators', () => {
    describe('extractVariableRefs', () => {
        it('extracts variable references from text', () => {
            expect(extractVariableRefs('Calculate {@L@} + {@I@}'))
                .toEqual(['L', 'I']);
        });

        it('returns unique refs only', () => {
            expect(extractVariableRefs('{@a@} + {@a@} + {@b@}'))
                .toEqual(['a', 'b']);
        });

        it('returns empty for no refs', () => {
            expect(extractVariableRefs('No variables here')).toEqual([]);
        });
    });

    describe('validateVariableReferences', () => {
        it('finds undefined variables', () => {
            const warnings = validateVariableReferences(
                'Calculate {@L@} + {@I@}',
                [{ name: 'L' }]
            );
            expect(warnings).toHaveLength(1);
            expect(warnings[0].variable).toBe('I');
        });

        it('returns empty when all defined', () => {
            const warnings = validateVariableReferences(
                'Calculate {@L@}',
                [{ name: 'L' }]
            );
            expect(warnings).toHaveLength(0);
        });
    });

    describe('validateMaximaExpression', () => {
        it('accepts valid expressions', () => {
            expect(validateMaximaExpression('rand(10)+1')).toBeNull();
            expect(validateMaximaExpression('0.5 * L * I * I')).toBeNull();
            expect(validateMaximaExpression('sin(x) + cos(y)')).toBeNull();
        });

        it('rejects empty expressions', () => {
            expect(validateMaximaExpression('')).not.toBeNull();
        });

        it('detects unmatched parentheses', () => {
            expect(validateMaximaExpression('sin(x')).toContain('parenthesis');
            expect(validateMaximaExpression('sin)x(')).toContain('parenthesis');
        });

        it('detects unmatched brackets', () => {
            expect(validateMaximaExpression('[1, 2')).toContain('bracket');
        });
    });

    describe('validateVariableName', () => {
        it('accepts valid names', () => {
            expect(validateVariableName('L')).toBeNull();
            expect(validateVariableName('ans1')).toBeNull();
            expect(validateVariableName('my_var')).toBeNull();
        });

        it('rejects invalid names', () => {
            expect(validateVariableName('')).not.toBeNull();
            expect(validateVariableName('1abc')).not.toBeNull();
            expect(validateVariableName('a b')).not.toBeNull();
        });

        it('rejects reserved words', () => {
            expect(validateVariableName('if')).toContain('reserved');
            expect(validateVariableName('true')).toContain('reserved');
        });
    });

    describe('validateQuestionData', () => {
        it('reports missing name', () => {
            const issues = validateQuestionData({ name: '', questionText: 'test', parts: [{ id: 1, type: 'numerical', answer: 'ans1' }], variables: [] });
            expect(issues.some(i => i.message.includes('name'))).toBe(true);
        });

        it('reports no parts', () => {
            const issues = validateQuestionData({ name: 'Test', questionText: 'test', parts: [], variables: [] });
            expect(issues.some(i => i.message.includes('part'))).toBe(true);
        });

        it('reports MCQ without options', () => {
            const issues = validateQuestionData({
                name: 'Test',
                questionText: 'test',
                parts: [{ id: 1, type: 'radio', answer: 'ans1', options: [], grading: {} }],
                variables: [],
            });
            expect(issues.some(i => i.message.includes('options') || i.message.includes('choice'))).toBe(true);
        });

        it('reports MCQ without correct answer', () => {
            const issues = validateQuestionData({
                name: 'Test',
                questionText: 'test',
                parts: [{
                    id: 1, type: 'radio', answer: 'ans1',
                    options: [{ value: 'A', correct: false }, { value: 'B', correct: false }],
                    grading: {},
                }],
                variables: [],
            });
            expect(issues.some(i => i.message.includes('correct'))).toBe(true);
        });

        it('warns about tolerance inversion', () => {
            const issues = validateQuestionData({
                name: 'Test', questionText: 'test',
                parts: [{
                    id: 1, type: 'numerical', answer: 'ans1',
                    grading: { tightTol: 0.5, wideTol: 0.1, checkSigFigs: false },
                    options: [],
                }],
                variables: [],
            });
            expect(issues.some(i => i.message.includes('tolerance') || i.message.includes('Tight'))).toBe(true);
        });
    });
});
