// @vitest-environment jsdom
// Premortem F5: the prerequisite gate was literally "is(ans1 = ans1)" for
// algebraic/radio/string/matrix prerequisites while the student-facing text
// promised "must answer part (a) correctly". Radio and string prerequisites
// now get a REAL check; non-checkable types get honest wording + W-PRE-04.
import { describe, it, expect } from 'vitest';
import { generateStackXML } from '../../generators/xml-generator.js';
import { parseStackXML } from '../../parsers/xml-parser.js';
import { validateQuestionData } from '../../core/validators.js';

const GRADING = { tolType: 'absolute', tightTol: 0.1, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false };

function twoPartQuestion(firstPart, extraVars = []) {
    return {
        name: 'Prereq gate',
        questionText: 'Two steps.',
        variables: [
            { name: 'ta1', type: 'calc', value: '7' },
            { name: 'ta2', type: 'calc', value: '14' },
            ...extraVars,
        ],
        parts: [
            firstPart,
            {
                id: 2, type: 'numerical', text: 'Now double it.', answer: 'ans2',
                teacherAnswer: 'ta2', prerequisite: 1,
                grading: { ...GRADING },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            },
        ],
        generalFeedback: '', hints: [], images: [],
    };
}

describe('prerequisite gates are real where checkable (F5)', () => {
    it('radio prerequisite compares against the correct option value', () => {
        const q = twoPartQuestion({
            id: 1, type: 'radio', text: 'Pick.', answer: 'ans1', teacherAnswer: '',
            grading: { ...GRADING },
            options: [
                { value: 'wrong one', correct: false },
                { value: 'right one', correct: true },
            ],
            graphCode: '', gradingCode: '', feedback: {},
        });
        const xml = generateStackXML(q);
        expect(xml).toContain('prereq_passed: is(ans1 = "right one");');
        expect(xml).not.toContain('is(ans1 = ans1)');
        expect(xml).toContain('You must answer part (a) correctly');
    });

    it('string prerequisite compares against the teacher answer', () => {
        const q = twoPartQuestion({
            id: 1, type: 'string', text: 'Name it.', answer: 'ans1', teacherAnswer: 'ta1',
            grading: { ...GRADING },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        }, [{ name: 'sname', type: 'calc', value: '"ohm"' }]);
        q.parts[0].teacherAnswer = 'sname';
        const xml = generateStackXML(q);
        expect(xml).toContain('prereq_passed: is(ans1 = sname);');
        expect(xml).toContain('You must answer part (a) correctly');
    });

    it('algebraic prerequisite gets honest attempted-only wording', () => {
        const q = twoPartQuestion({
            id: 1, type: 'algebraic', text: 'Expand.', answer: 'ans1', teacherAnswer: 'ta1',
            grading: { ...GRADING },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        });
        const xml = generateStackXML(q);
        // gate still forces an attempt, but never claims to check correctness
        expect(xml).toContain('prereq_passed: is(ans1 = ans1);');
        expect(xml).toContain('must be attempted');
        expect(xml).toContain('You must complete part (a) before attempting this part.');
        expect(xml).not.toContain('You must answer part (a) correctly');
    });

    it('W-PRE-04 warns the teacher about non-checkable prerequisites', () => {
        const q = twoPartQuestion({
            id: 1, type: 'algebraic', text: 'Expand.', answer: 'ans1', teacherAnswer: 'ta1',
            grading: { ...GRADING },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        });
        const issues = validateQuestionData(q);
        expect(issues.map(i => i.code)).toContain('W-PRE-04');
    });

    it('numerical prerequisites stay warning-free and keep the real check', () => {
        const q = twoPartQuestion({
            id: 1, type: 'numerical', text: 'Halve.', answer: 'ans1', teacherAnswer: 'ta1',
            grading: { ...GRADING },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        });
        expect(validateQuestionData(q).map(i => i.code)).not.toContain('W-PRE-04');
        const xml = generateStackXML(q);
        expect(xml).toContain('prereq_diff');
        expect(xml).toContain('You must answer part (a) correctly');
    });

    it('radio-prerequisite roundtrip is byte-stable with no rebuild notice', () => {
        const q = twoPartQuestion({
            id: 1, type: 'radio', text: 'Pick.', answer: 'ans1', teacherAnswer: '',
            grading: { ...GRADING },
            options: [
                { value: 'wrong one', correct: false },
                { value: 'right one', correct: true },
            ],
            graphCode: '', gradingCode: '', feedback: {},
        });
        const xml1 = generateStackXML(q);
        const state = parseStackXML(xml1);
        expect((state.importNotices || []).filter(n => /REBUILT/.test(n))).toEqual([]);
        expect(state.parts[1].prerequisite).toBe(1);
        expect(generateStackXML(state)).toBe(xml1);
    });

    it('algebraic-prerequisite roundtrip is byte-stable with no rebuild notice', () => {
        const q = twoPartQuestion({
            id: 1, type: 'algebraic', text: 'Expand.', answer: 'ans1', teacherAnswer: 'ta1',
            grading: { ...GRADING },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        });
        const xml1 = generateStackXML(q);
        const state = parseStackXML(xml1);
        expect((state.importNotices || []).filter(n => /REBUILT/.test(n))).toEqual([]);
        expect(state.parts[1].prerequisite).toBe(1);
        expect(generateStackXML(state)).toBe(xml1);
    });

    it('qtests still emit for a radio-gated question (gate is decidable)', () => {
        const q = twoPartQuestion({
            id: 1, type: 'radio', text: 'Pick.', answer: 'ans1', teacherAnswer: '',
            grading: { ...GRADING },
            options: [
                { value: 'wrong one', correct: false },
                { value: 'right one', correct: true },
            ],
            graphCode: '', gradingCode: '', feedback: {},
        });
        const xml = generateStackXML(q);
        const qtests = xml.match(/<qtest>/g) || [];
        expect(qtests.length).toBeGreaterThanOrEqual(2);
        // The wrong-answer scenario picks the wrong option, so the gated
        // part's PRT must land on the prereq-F note.
        expect(xml).toContain('prt2-prereq-F');
    });
});
