// @vitest-environment jsdom
// Premortem F6: a radio option whose label contains a double quote was
// silently dropped on reimport (the option regex could not cross an escaped
// quote) — a save/reload/export cycle shipped a different question.
import { describe, it, expect } from 'vitest';
import { parseStackXML } from '../../parsers/xml-parser.js';
import { generateStackXML } from '../../generators/xml-generator.js';

function mcq(options) {
    return {
        name: 'Quoted MCQ',
        questionText: 'Pick one.',
        variables: [],
        parts: [{
            id: 1, type: 'radio', text: 'Which effect?', answer: 'ans1',
            teacherAnswer: '',
            grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false },
            options, graphCode: '', gradingCode: '', feedback: {},
        }],
        generalFeedback: '', hints: [], images: [],
    };
}

describe('radio options with quotes survive reimport (F6)', () => {
    it('recovers all options including the quoted label', () => {
        const xml = generateStackXML(mcq([
            { value: 'the "skin effect" answer', correct: false },
            { value: 'resistive heating', correct: true },
            { value: 'inductive coupling', correct: false },
        ]));
        const state = parseStackXML(xml);
        const opts = state.parts[0].options;
        expect(opts.length).toBe(3);
        expect(opts.map(o => o.value)).toContain('the "skin effect" answer');
        expect(opts.find(o => o.correct).value).toBe('resistive heating');
    });

    it('recovers the correct flag when the CORRECT option carries the quote', () => {
        const xml = generateStackXML(mcq([
            { value: 'plain wrong', correct: false },
            { value: 'the "right" one', correct: true },
        ]));
        const state = parseStackXML(xml);
        const opts = state.parts[0].options;
        expect(opts.length).toBe(2);
        expect(opts.find(o => o.correct).value).toBe('the "right" one');
    });
});
