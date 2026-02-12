import { describe, it, expect } from 'vitest';
import { generateNumericalPRT } from '../../generators/prts/numerical-prt.js';

describe('Numerical PRT Generator', () => {
    const basePart = {
        answer: 'ans1',
        grading: {
            tightTol: 0.05,
            wideTol: 0.20,
            checkSigFigs: false,
            sigFigs: 3,
            penalty: 0.1,
            checkPowerOf10: false,
            powerOf10Penalty: 0.5,
        },
        feedback: {},
    };

    it('generates two-tier tolerance nodes (wide + tight)', () => {
        const xml = generateNumericalPRT(basePart, 'prt1');

        // Should have Node 0 (wide) and Node 1 (tight)
        expect(xml).toContain('<name>0</name>');
        expect(xml).toContain('<name>1</name>');
        expect(xml).toContain('<answertest>ATNumAbs</answertest>');

        // Node 0: wide tolerance
        expect(xml).toContain('<testoptions>0.2</testoptions>');
        // Node 1: tight tolerance
        expect(xml).toContain('<testoptions>0.05</testoptions>');
    });

    it('gives partial credit (0.5) for wide tolerance pass', () => {
        const xml = generateNumericalPRT(basePart, 'prt1');
        // Node 0 true should give 0.5
        expect(xml).toMatch(/<name>0<\/name>[\s\S]*?<truescore>0\.5<\/truescore>/);
    });

    it('gives full credit (1.0) for tight tolerance pass', () => {
        const xml = generateNumericalPRT(basePart, 'prt1');
        // Node 1 true should give 1.0
        expect(xml).toMatch(/<name>1<\/name>[\s\S]*?<truescore>1<\/truescore>/);
    });

    it('includes sig figs node when enabled', () => {
        const part = {
            ...basePart,
            grading: { ...basePart.grading, checkSigFigs: true, sigFigs: 3 },
        };
        const xml = generateNumericalPRT(part, 'prt1');

        expect(xml).toContain('<name>2</name>');
        expect(xml).toContain('ATNumSigFigs');
        expect(xml).toContain('<testoptions>3</testoptions>');
    });

    it('applies penalty for wrong sig figs', () => {
        const part = {
            ...basePart,
            grading: { ...basePart.grading, checkSigFigs: true, sigFigs: 3, penalty: 0.1 },
        };
        const xml = generateNumericalPRT(part, 'prt1');

        // SigFigs node false should subtract penalty
        expect(xml).toMatch(/<answertest>ATNumSigFigs<\/answertest>[\s\S]*?<falsescoremode>-<\/falsescoremode>/);
        expect(xml).toMatch(/<answertest>ATNumSigFigs<\/answertest>[\s\S]*?<falsescore>0\.1<\/falsescore>/);
    });

    it('does NOT include sig figs node when disabled', () => {
        const xml = generateNumericalPRT(basePart, 'prt1');
        expect(xml).not.toContain('ATNumSigFigs');
    });

    // FIX BUG 1: Power of 10 check
    it('includes power-of-10 check when enabled', () => {
        const part = {
            ...basePart,
            grading: { ...basePart.grading, checkPowerOf10: true, powerOf10Penalty: 0.5 },
        };
        const xml = generateNumericalPRT(part, 'prt1');

        // Should have feedbackvariables with p10 detection
        expect(xml).toContain('<feedbackvariables>');
        expect(xml).toContain('p10_ratio');
        expect(xml).toContain('is_p10_error');

        // Should have a node checking is_p10_error
        expect(xml).toContain('<sans>is_p10_error</sans>');
        expect(xml).toContain('<tans>true</tans>');
    });

    it('does NOT include power-of-10 check when disabled', () => {
        const xml = generateNumericalPRT(basePart, 'prt1');
        expect(xml).not.toContain('p10_ratio');
        expect(xml).not.toContain('is_p10_error');
        expect(xml).not.toContain('<feedbackvariables>');
    });

    it('chains nodes correctly: wide → tight → sigfigs', () => {
        const part = {
            ...basePart,
            grading: { ...basePart.grading, checkSigFigs: true, sigFigs: 3 },
        };
        const xml = generateNumericalPRT(part, 'prt1');

        // Node 0 true → Node 1
        expect(xml).toMatch(/<name>0<\/name>[\s\S]*?<truenextnode>1<\/truenextnode>/);
        // Node 1 true → Node 2
        expect(xml).toMatch(/<name>1<\/name>[\s\S]*?<truenextnode>2<\/truenextnode>/);
        // Node 2 → end
        expect(xml).toMatch(/<name>2<\/name>[\s\S]*?<truenextnode>-1<\/truenextnode>/);
    });

    it('uses custom feedback messages when provided', () => {
        const part = {
            ...basePart,
            feedback: {
                correct: 'Great job!',
                incorrect: 'Try again.',
                closeButInaccurate: 'Almost there.',
            },
        };
        const xml = generateNumericalPRT(part, 'prt1');

        expect(xml).toContain('Great job!');
        expect(xml).toContain('Try again.');
        expect(xml).toContain('Almost there.');
    });

    it('generates valid answer notes with PRT name', () => {
        const xml = generateNumericalPRT(basePart, 'prt1');
        expect(xml).toContain('prt1-0-T');
        expect(xml).toContain('prt1-0-F');
        expect(xml).toContain('prt1-1-T');
        expect(xml).toContain('prt1-1-F');
    });
});
