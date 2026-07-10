// A11 — house Rule 3 alignment: NumRelative 5% primary, sign-flip diagnostic,
// 50% diagnostic tier, degenerate-zero absolute fallback, raw-input sig-figs
// sans invariant (S7/F-3 twin).
import { describe, it, expect } from 'vitest';
import { generateNumericalPRT } from '../../generators/prts/numerical-prt.js';
import { generateUnitsPRT } from '../../generators/prts/units-prt.js';
import { teacherAnswerMayBeZero } from '../../generators/tolerance-mode.js';
import { generateStackXML } from '../../generators/xml-generator.js';
import { TEMPLATES } from '../../templates/index.js';

const relativePart = {
    answer: 'ans1',
    teacherAnswer: 'ta1',
    grading: {
        tolType: 'relative',
        tightTol: 0.05,
        wideTol: 0.15,
        checkSigFigs: true,
        sigFigs: 3,
        penalty: 0.1,
        checkPowerOf10: true,
        powerOf10Penalty: 0.5,
    },
    feedback: {},
};

const nonZeroCtx = {
    variables: [
        { name: 'a', type: 'rand', value: 'rand(5)+1' },
        { name: 'ta1', type: 'calc', value: 'a * 2' },
    ],
};

const zeroCtx = {
    variables: [
        { name: 'a', type: 'rand', value: 'rand(5)+1' },
        { name: 'ta1', type: 'calc', value: '0' },
    ],
};

describe('A11: relative-tolerance house pipeline', () => {
    it('emits NumRelative wide+tight nodes with the house tolerances', () => {
        const xml = generateNumericalPRT(relativePart, 'prt1', nonZeroCtx);
        expect(xml).toContain('<answertest>NumRelative</answertest>');
        expect(xml).not.toContain('<answertest>NumAbsolute</answertest>');
        expect(xml).toContain('<testoptions>0.15</testoptions>');
        expect(xml).toContain('<testoptions>0.05</testoptions>');
    });

    it('emits the sign-flip diagnostic: guarded fv ratio + 0.5 node', () => {
        const xml = generateNumericalPRT(relativePart, 'prt1', nonZeroCtx);
        expect(xml).toContain('sf_safe_tans: if is(ta1 = 0) then 1 else ta1;');
        expect(xml).toMatch(/sf_ratio:\s*ans1\s*\/\s*sf_safe_tans/);
        expect(xml).toContain('is_sign_flip: is(abs(sf_ratio + 1) < 0.05);');
        expect(xml).toContain('<sans>is_sign_flip</sans>');
        expect(xml).toMatch(/<sans>is_sign_flip<\/sans>[\s\S]*?<truescore>0\.5<\/truescore>/);
        expect(xml).toContain('Sign error');
    });

    it('chains wide-fail -> sign-flip -> power-of-10 (node ids 0,1,2,3,4)', () => {
        const xml = generateNumericalPRT(relativePart, 'prt1', nonZeroCtx);
        // wide(0) false -> sign-flip(3); sign-flip false -> p10(4)
        expect(xml).toMatch(/<name>0<\/name>[\s\S]*?<falsenextnode>3<\/falsenextnode>/);
        expect(xml).toMatch(/<name>3<\/name>[\s\S]*?<sans>is_sign_flip<\/sans>[\s\S]*?<falsenextnode>4<\/falsenextnode>/);
        expect(xml).toMatch(/<name>4<\/name>[\s\S]*?<sans>is_p10_error<\/sans>/);
    });

    it('power-of-10 diagnostic awards the 0.5 house tier', () => {
        const xml = generateNumericalPRT(relativePart, 'prt1', nonZeroCtx);
        expect(xml).toMatch(/<sans>is_p10_error<\/sans>[\s\S]*?<truescore>0\.5<\/truescore>/);
    });

    it('sig-figs node keeps the RAW input as sans (S7/F-3)', () => {
        const xml = generateNumericalPRT(relativePart, 'prt1', nonZeroCtx);
        expect(xml).toMatch(/<answertest>NumSigFigs<\/answertest>\s*<sans>ans1<\/sans>/);
    });

    it('falls back to NumAbsolute and omits sign-flip when ta can be zero', () => {
        const xml = generateNumericalPRT(relativePart, 'prt1', zeroCtx);
        expect(xml).toContain('<answertest>NumAbsolute</answertest>');
        expect(xml).not.toContain('NumRelative');
        expect(xml).not.toContain('is_sign_flip');
    });

    it('falls back when the teacher answer cannot be evaluated (unknown = degenerate)', () => {
        const xml = generateNumericalPRT(relativePart, 'prt1', { variables: [] });
        expect(xml).toContain('<answertest>NumAbsolute</answertest>');
        expect(xml).not.toContain('is_sign_flip');
    });

    it('honours the sticky import decision (signFlip=false keeps relative, no node)', () => {
        const imported = {
            ...relativePart,
            grading: { ...relativePart.grading, signFlip: false },
        };
        const xml = generateNumericalPRT(imported, 'prt1');
        expect(xml).toContain('<answertest>NumRelative</answertest>');
        expect(xml).not.toContain('is_sign_flip');
    });

    it('absolute parts (tolType absent) keep the legacy NumAbsolute shape', () => {
        const legacy = { ...relativePart, grading: { ...relativePart.grading } };
        delete legacy.grading.tolType;
        const xml = generateNumericalPRT(legacy, 'prt1', nonZeroCtx);
        expect(xml).toContain('<answertest>NumAbsolute</answertest>');
        expect(xml).not.toContain('is_sign_flip');
    });
});

describe('A11: units tolerance mode', () => {
    const unitsPart = {
        answer: 'ans1',
        teacherAnswer: 'ta1',
        type: 'units',
        grading: { tolType: 'relative', tightTol: 0.05, wideTol: 0.15, checkSigFigs: false, sigFigs: 3, penalty: 0.1 },
        feedback: {},
    };
    const unitsCtx = {
        variables: [
            { name: 'a', type: 'rand', value: 'rand(5)+1' },
            { name: 't', type: 'rand', value: 'rand(10)+5' },
            { name: 'v_val', type: 'calc', value: 'a * t' },
            { name: 'ta1', type: 'algebraic', value: 'stackunits(v_val, m/s)' },
        ],
    };

    it('uses UnitsRelative when the stackunits numeric part is provably nonzero', () => {
        const xml = generateUnitsPRT(unitsPart, 'prt1', unitsCtx);
        expect(xml).toContain('<answertest>UnitsRelative</answertest>');
    });

    it('falls back to UnitsAbsolute without evaluable context', () => {
        const xml = generateUnitsPRT(unitsPart, 'prt1', { variables: [] });
        expect(xml).toContain('<answertest>UnitsAbsolute</answertest>');
    });

    it('never emits a sign-flip node for units (unverifiable CAS maths)', () => {
        const xml = generateUnitsPRT(unitsPart, 'prt1', unitsCtx);
        expect(xml).not.toContain('is_sign_flip');
    });
});

describe('A11: teacherAnswerMayBeZero', () => {
    it('detects a constant-zero teacher answer', () => {
        expect(teacherAnswerMayBeZero('ta1', zeroCtx.variables)).toBe(true);
    });
    it('accepts a provably nonzero chain', () => {
        expect(teacherAnswerMayBeZero('ta1', nonZeroCtx.variables)).toBe(false);
    });
    it('is conservative about unknowns', () => {
        expect(teacherAnswerMayBeZero('ta1', [])).toBe(true);
        expect(teacherAnswerMayBeZero('ta1', [{ name: 'ta1', type: 'algebraic', value: 'determinant(A)' }])).toBe(true);
        expect(teacherAnswerMayBeZero('', nonZeroCtx.variables)).toBe(true);
    });
    it('unwraps stackunits for units answers', () => {
        const vars = [
            { name: 'v', type: 'rand', value: 'rand(5)+1' },
            { name: 'ta1', type: 'algebraic', value: 'stackunits(v, m/s)' },
        ];
        expect(teacherAnswerMayBeZero('ta1', vars)).toBe(false);
    });
});

describe('A11: template-wide invariants', () => {
    const sigFigsFamily = new Set(['NumSigFigs', 'SigFigsStrict', 'NumDecPlaces', 'Units', 'UnitsStrict']);

    for (const [key, tpl] of Object.entries(TEMPLATES)) {
        if (!tpl.parts || tpl.parts.length === 0) continue;
        it(`template "${key}": raw-input-required tests use a bare input name as sans`, () => {
            const xml = generateStackXML(tpl);
            const inputs = new Set([...xml.matchAll(/<input>\s*<name>([^<]+)<\/name>/g)].map(m => m[1]));
            for (const m of xml.matchAll(/<answertest>([^<]+)<\/answertest>\s*<sans>([^<]+)<\/sans>/g)) {
                if (sigFigsFamily.has(m[1])) {
                    expect(inputs.has(m[2].trim()), `${m[1]} sans "${m[2]}" is not a raw input in "${key}"`).toBe(true);
                }
            }
        });
    }

    it('numerical templates with rand-safe answers carry the sign-flip diagnostic', () => {
        const xml = generateStackXML(TEMPLATES.inductor);
        expect(xml).toContain('<answertest>NumRelative</answertest>');
        expect(xml).toContain('is_sign_flip');
    });

    it('kinematics (units) uses UnitsRelative', () => {
        const xml = generateStackXML(TEMPLATES.kinematics);
        expect(xml).toContain('<answertest>UnitsRelative</answertest>');
    });
});
