import { describe, it, expect } from 'vitest';
import { evaluatePreviewValue, detectVariableType, parseVariableDefinition } from '../../parsers/variable-parser.js';

describe('Variable Parser', () => {
    describe('detectVariableType', () => {
        it('detects rand type', () => {
            expect(detectVariableType('rand(10)+1')).toBe('rand');
            expect(detectVariableType('rand([1,2,3])')).toBe('rand');
            expect(detectVariableType('rand_with_step(0,10,0.5)')).toBe('rand');
        });

        it('detects calc type for arithmetic', () => {
            expect(detectVariableType('0.5 * L * I * I')).toBe('calc');
            expect(detectVariableType('sin(x) + 3')).toBe('calc');
        });

        it('defaults to calc for ambiguous expressions', () => {
            expect(detectVariableType('a + b')).toBe('calc');
        });
    });

    describe('evaluatePreviewValue (BUG 3 fix: rand offset)', () => {
        it('evaluates rand(n) correctly', () => {
            const val = evaluatePreviewValue('rand', 'rand(10)', {});
            expect(typeof val).toBe('number');
            expect(val).toBeGreaterThanOrEqual(0);
            expect(val).toBeLessThan(10);
        });

        it('evaluates rand(n)+k with offset (BUG 3 fix)', () => {
            // Run multiple times to verify offset is applied
            for (let i = 0; i < 20; i++) {
                const val = evaluatePreviewValue('rand', 'rand(10)+1', {});
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(10);
            }
        });

        it('evaluates rand(n)+k with larger offset', () => {
            for (let i = 0; i < 20; i++) {
                const val = evaluatePreviewValue('rand', 'rand(5)+5', {});
                expect(val).toBeGreaterThanOrEqual(5);
                expect(val).toBeLessThanOrEqual(9);
            }
        });

        it('evaluates rand([list]) correctly', () => {
            const val = evaluatePreviewValue('rand', 'rand([2, 4, 6])', {});
            expect([2, 4, 6]).toContain(val);
        });

        it('evaluates rand_with_step as number not string (BUG 6 fix)', () => {
            const val = evaluatePreviewValue('rand', 'rand_with_step(0, 10, 0.5)', {});
            expect(typeof val).toBe('number');
            expect(val).toBeGreaterThanOrEqual(0);
            expect(val).toBeLessThanOrEqual(10);
        });

        it('evaluates calc expressions with variable substitution', () => {
            const val = evaluatePreviewValue('calc', '0.5 * L * I * I', { L: 2, I: 3 });
            expect(val).toBe(9);
        });

        it('evaluates calc with trig functions', () => {
            const val = evaluatePreviewValue('calc', 'sin(pi/2)', {});
            expect(val).toBeCloseTo(1, 5);
        });

        it('returns expression string for algebraic type', () => {
            const val = evaluatePreviewValue('algebraic', 'expand((x+a)*(x-b))', { a: 3, b: 2 });
            expect(typeof val).toBe('string');
            expect(val).toContain('expand');
        });

        it('handles expressions with previously defined variables', () => {
            const prev = { a: 5, b: 3 };
            const val = evaluatePreviewValue('calc', 'a + b', prev);
            expect(val).toBe(8);
        });
    });

    describe('parseVariableDefinition', () => {
        it('parses simple definition', () => {
            const result = parseVariableDefinition('L: rand(10)+1');
            expect(result).toEqual({ name: 'L', value: 'rand(10)+1' });
        });

        it('handles trailing semicolons', () => {
            const result = parseVariableDefinition('ans1: 0.5 * L * I;');
            expect(result.value).toBe('0.5 * L * I');
        });

        it('returns null for invalid format', () => {
            expect(parseVariableDefinition('invalid line')).toBeNull();
        });

        it('handles colons in value (e.g., ternary)', () => {
            const result = parseVariableDefinition('x: if a > 0 then a else -a');
            expect(result.name).toBe('x');
            expect(result.value).toContain('if a > 0');
        });
    });
});
