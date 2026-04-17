import { describe, it, expect } from 'vitest';
import { lintStopSlop } from '../../core/stop-slop-lint.js';

describe('lintStopSlop', () => {
    it('returns empty for clean prose', () => {
        const data = {
            questionText: 'What is the value of x when f(x) = 0?',
            generalFeedback: 'Set the expression to zero and solve for x.',
            hints: ['Try factoring first.'],
            parts: [{ id: 1, text: 'Solve for x.', feedback: { correct: 'Well done.' } }],
        };
        expect(lintStopSlop(data)).toEqual([]);
    });

    it('flags a single Tier-1 word with field attribution', () => {
        const data = {
            questionText: 'This is a crucial step.',
            parts: [],
        };
        const findings = lintStopSlop(data);
        expect(findings).toHaveLength(1);
        expect(findings[0].field).toBe('Question text');
        expect(findings[0].matches).toContain('crucial');
        expect(findings[0].suggest).toContain('important');
    });

    it('flags multiple patterns in the same field as separate findings', () => {
        const data = {
            questionText: 'It is important to note that this leverages a crucial insight.',
            parts: [],
        };
        const findings = lintStopSlop(data);
        const fieldFindings = findings.filter(f => f.field === 'Question text');
        // Expect findings for: "it is important to note", "leverages", "crucial"
        expect(fieldFindings.length).toBeGreaterThanOrEqual(3);
        const allMatches = fieldFindings.flatMap(f => f.matches).join(' ');
        expect(allMatches).toContain('crucial');
        expect(allMatches).toContain('leverages');
    });

    it('attributes findings to the correct field across multiple fields', () => {
        const data = {
            questionText: 'A crucial question.',
            generalFeedback: 'We utilize the formula.',
            hints: [],
            parts: [{
                id: 1, text: 'Clean part text.',
                feedback: { correct: 'Delve into the calculation.' },
            }],
        };
        const findings = lintStopSlop(data);
        const fields = new Set(findings.map(f => f.field));
        expect(fields.has('Question text')).toBe(true);
        expect(fields.has('General feedback')).toBe(true);
        expect(fields.has('Part (a) feedback: correct')).toBe(true);
        expect(fields.has('Part (a) text')).toBe(false);
    });

    it('matches case-insensitively', () => {
        const data = { questionText: 'A CRUCIAL insight.', parts: [] };
        const findings = lintStopSlop(data);
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].matches).toContain('crucial');
    });

    it('respects word boundaries (does not flag substrings)', () => {
        // "crucial" should not match inside "uncrucial" (hypothetical) or
        // words where it's embedded without boundary. Also "realm" shouldn't
        // match inside "realms-of" etc. — actually "realm" does match "realm" at
        // word boundary. Test a more realistic non-match: "realmarket".
        const data = {
            questionText: 'Discuss the realmarket and practicality of this approach.',
            parts: [],
        };
        const findings = lintStopSlop(data);
        const matches = findings.flatMap(f => f.matches);
        expect(matches).not.toContain('realm');
    });

    it('flags hint fields with 1-based indices', () => {
        const data = {
            questionText: 'Clean.',
            hints: ['First hint is clean.', 'Second hint utilizes the formula.'],
            parts: [],
        };
        const findings = lintStopSlop(data);
        expect(findings.some(f => f.field === 'Hint 2')).toBe(true);
        expect(findings.some(f => f.field === 'Hint 1')).toBe(false);
    });

    it('handles missing or null data gracefully', () => {
        expect(lintStopSlop(null)).toEqual([]);
        expect(lintStopSlop({})).toEqual([]);
        expect(lintStopSlop({ parts: [] })).toEqual([]);
    });

    it('ignores non-prose fields (graphCode, gradingCode, options)', () => {
        const data = {
            questionText: 'Clean question.',
            parts: [{
                id: 1, text: 'Clean.',
                graphCode: 'crucial realm paradigm',  // code field, skipped
                gradingCode: 'utilize leverage',       // code field, skipped
                options: [{ value: 'crucial answer', correct: true }],  // skipped
                feedback: {},
            }],
        };
        const findings = lintStopSlop(data);
        expect(findings).toEqual([]);
    });
});
