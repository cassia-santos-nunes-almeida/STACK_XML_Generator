// Premortem F2: a raw Maxima expression in the teacher-answer field (or the
// wrong-answer example) must pass through the same Maxima lints that guard
// variable values — "2*pi*r" or "2a" in <tans> is a CAS break in Moodle that
// used to export with zero findings.
import { describe, it, expect } from 'vitest';
import { validateQuestionData } from '../../core/validators.js';

function q(taValue, extra = {}) {
    return {
        name: 'TA lint',
        questionText: 'Compute {@ta1@}.',
        variables: [
            { name: 'r', type: 'rand', value: 'rand(5)+1' },
            { name: 'ta1', type: 'calc', value: '2*%pi*r' },
        ],
        parts: [{
            id: 1,
            type: 'numerical',
            text: 'Value?',
            answer: 'ans1',
            teacherAnswer: taValue,
            grading: { tolType: 'relative', tightTol: 0.05, wideTol: 0.15, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false },
            options: [], graphCode: '', gradingCode: '', feedback: {},
            ...extra,
        }],
        generalFeedback: '', hints: [], images: [],
    };
}

const codes = issues => issues.map(i => i.code);

describe('teacher-answer Maxima lint (F2)', () => {
    it('bare pi in a raw teacher answer is a blocking E-MAX-02', () => {
        const issues = validateQuestionData(q('2*pi*r'));
        const hit = issues.find(i => i.code === 'E-MAX-02' && /Part \(a\)/.test(i.message));
        expect(hit).toBeTruthy();
        expect(hit.level).toBe('error');
    });

    it('implied multiplication in a raw teacher answer is flagged (W-MAX-05)', () => {
        const issues = validateQuestionData(q('2a'));
        expect(codes(issues)).toContain('W-MAX-05');
    });

    it('unbalanced parenthesis in a raw teacher answer is flagged (W-MAX-01)', () => {
        const issues = validateQuestionData(q('sqrt(2'));
        const hit = issues.find(i => i.code === 'W-MAX-01' && /Part \(a\)/.test(i.message));
        expect(hit).toBeTruthy();
    });

    it('a bare-identifier teacher answer naming a defined variable stays clean', () => {
        const issues = validateQuestionData(q('ta1'));
        expect(issues.filter(i => i.level === 'error')).toEqual([]);
        expect(codes(issues)).not.toContain('W-MAX-01');
        expect(codes(issues)).not.toContain('W-MAX-05');
    });

    it('a sound raw expression (stackunits with %pi) stays clean', () => {
        const issues = validateQuestionData(q('stackunits(2*%pi*r, m)'));
        expect(issues.filter(i => i.level === 'error')).toEqual([]);
    });

    it('the wrong-answer example (distractor) is linted too', () => {
        const issues = validateQuestionData(q('ta1', { distractor: '-pi*r^2' }));
        const hit = issues.find(i => i.code === 'E-MAX-02' && /wrong-answer/.test(i.message));
        expect(hit).toBeTruthy();
    });
});
