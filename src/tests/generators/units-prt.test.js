import { describe, it, expect } from 'vitest';
import { generateUnitsPRT } from '../../generators/prts/units-prt.js';

describe('Units PRT Generator (BUG 2 Fix)', () => {
    const basePart = {
        answer: 'ans1',
        teacherAnswer: 'ta1',
        grading: {
            tightTol: 0.05,
            wideTol: 0.1,
            checkSigFigs: false,
            sigFigs: 3,
            penalty: 0.1,
        },
        feedback: {},
    };

    it('uses UnitsAbsolute answer test (NOT AlgEquiv)', () => {
        const xml = generateUnitsPRT(basePart, 'prt1');
        expect(xml).toContain('<answertest>UnitsAbsolute</answertest>');
        expect(xml).not.toContain('<answertest>AlgEquiv</answertest>');
    });

    it('includes tolerance in test options', () => {
        const xml = generateUnitsPRT(basePart, 'prt1');
        expect(xml).toContain('<testoptions>0.05</testoptions>');
    });

    it('includes sig figs check when enabled', () => {
        const part = {
            ...basePart,
            grading: { ...basePart.grading, checkSigFigs: true, sigFigs: 4 },
        };
        const xml = generateUnitsPRT(part, 'prt1');

        expect(xml).toContain('<name>1</name>');
        expect(xml).toContain('NumSigFigs');
        expect(xml).toContain('<testoptions>4</testoptions>');
    });

    it('provides unit-specific feedback on failure', () => {
        const xml = generateUnitsPRT(basePart, 'prt1');
        expect(xml).toContain('units');
    });
});
