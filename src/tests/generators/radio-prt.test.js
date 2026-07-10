import { describe, it, expect } from 'vitest';
import { generateRadioPRT, generateRadioTeacherAnswer } from '../../generators/prts/radio-prt.js';

describe('Radio PRT Generator', () => {
    const basePart = {
        answer: 'ans1',
        options: [
            { value: 'Option A', correct: false },
            { value: 'Option B', correct: true },
            { value: 'Option C', correct: false },
        ],
        feedback: {},
    };

    it('uses AlgEquiv to compare answer', () => {
        const xml = generateRadioPRT(basePart, 'prt1');
        expect(xml).toContain('<answertest>AlgEquiv</answertest>');
    });

    it('compares against the correct option VALUE (radio submits values, not indices)', () => {
        const xml = generateRadioPRT(basePart, 'prt1');
        expect(xml).toContain('<tans>&quot;Option B&quot;</tans>');
        expect(xml).not.toContain('<tans>2</tans>');
    });

    it('generates correct teacher answer expression', () => {
        const ta = generateRadioTeacherAnswer(basePart);
        expect(ta).toBe('"Option B"');
    });
});
