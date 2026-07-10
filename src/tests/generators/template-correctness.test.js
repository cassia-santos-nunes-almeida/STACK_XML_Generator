// A5-prep template/PRT correctness (A8-gate class defects found during the
// A5 Phase-1 re-verification):
// 1. STACK MCQ inputs return the SELECTED OPTION'S VALUE, not a 1-based
//    index — a PRT tans carrying an index marks every answer wrong and
//    breaks entirely under random_permutation shuffling.
// 2. Units parts must point tans at a stackunits(...) teacher answer
//    (deployed house style; a unitless tans is not a valid units-test tans).
// 3. calculus_int's teacher answer must be numerically evaluable in closed
//    form so A11's sign-flip gating and A5's qtest walk can sample it.
// 4. jsxgraph_sketch's model answer must be shaped like the student input
//    ([[x,y],...] pairs, matrix form) — a flat y-list errors its own
//    grading code when fed back as the model answer.
import { describe, it, expect } from 'vitest';
import { generateRadioPRT, generateRadioTeacherAnswer } from '../../generators/prts/radio-prt.js';
import { TEMPLATES } from '../../templates/index.js';

const mcqPart = {
    id: 1, type: 'radio', answer: 'ans1',
    options: [
        { value: '4', correct: false },
        { value: '7', correct: true },
        { value: '9', correct: false },
    ],
    grading: {}, feedback: {},
};

describe('Radio PRT compares option VALUE, not index (A5-prep)', () => {
    it('tans is the correct option value as a Maxima string', () => {
        const xml = generateRadioPRT(mcqPart, 'prt1');
        expect(xml).toContain('<tans>&quot;7&quot;</tans>');
        expect(xml).not.toContain('<tans>2</tans>');
    });

    it('generateRadioTeacherAnswer returns the quoted correct value', () => {
        expect(generateRadioTeacherAnswer(mcqPart)).toBe('"7"');
    });

    it('escapes embedded quotes the same way as the ta_ansN list', () => {
        const part = {
            ...mcqPart,
            options: [
                { value: 'say "hi"', correct: true },
                { value: 'other', correct: false },
            ],
        };
        expect(generateRadioTeacherAnswer(part)).toBe('"say \\"hi\\""');
    });
});

describe('Units parts carry stackunits teacher answers', () => {
    const unitsParts = [];
    Object.entries(TEMPLATES).forEach(([key, tpl]) => {
        (tpl.parts || []).forEach(p => {
            if (p.type === 'units') unitsParts.push({ key, tpl, part: p });
        });
    });

    it('finds units parts in the template set (sanity)', () => {
        expect(unitsParts.length).toBeGreaterThanOrEqual(3);
    });

    it('every units part teacher-answer variable is stackunits-wrapped', () => {
        unitsParts.forEach(({ key, tpl, part }) => {
            const taVar = (tpl.variables || []).find(v => v.name === part.teacherAnswer);
            expect(taVar, `${key}: ta variable ${part.teacherAnswer} missing`).toBeTruthy();
            expect(taVar.value, `${key}: ${part.teacherAnswer} must be stackunits(...)`)
                .toMatch(/^stackunits\s*\(/);
        });
    });
});

describe('calculus_int teacher answer is closed-form evaluable', () => {
    it('does not use integrate() for the model answer', () => {
        const ta = TEMPLATES.calculus_int.variables.find(v => v.name === 'ta1');
        expect(ta.value).not.toContain('integrate');
        expect(ta.value).toBe('k^3 + c*k');
    });
});

describe('jsxgraph_sketch model answer matches the input shape', () => {
    it('ta1 is a matrix of [x,y] pairs, not a flat y-list', () => {
        const ta = TEMPLATES.jsxgraph_sketch.variables.find(v => v.name === 'ta1');
        expect(ta.value).toMatch(/^matrix\(/);
        expect(ta.value).toContain('[x1,y1]');
    });
});
