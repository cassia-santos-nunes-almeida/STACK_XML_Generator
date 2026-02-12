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

    it('uses 1-based index for correct answer', () => {
        const xml = generateRadioPRT(basePart, 'prt1');
        // Option B is index 1 (0-based) → 2 (1-based)
        expect(xml).toContain('<tans>2</tans>');
    });

    it('generates correct teacher answer variable', () => {
        const ta = generateRadioTeacherAnswer(basePart);
        expect(ta).toBe('2');
    });
});
