// A10 — the questionnote interpolates teacher answers (taN — NEVER the
// student input name) alongside the random variables, with numeric answers
// rounded to keep notes short and distinct. Fixes the zero-rand empty-note
// edge, and makes MCQ notes distinct per shuffle.
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../../templates/index.js';
import { generateStackXML } from '../../generators/xml-generator.js';
import { questionNoteContent } from '../../generators/question-note.js';
import { validateQuestionData } from '../../core/validators.js';

function noteOf(xml) {
    return xml.match(/<questionnote format="html">\s*<text><!\[CDATA\[([\s\S]*?)\]\]><\/text>/)[1];
}

describe('A10: questionnote content', () => {
    it('projectile: rand variables plus rounded teacher answers', () => {
        const note = noteOf(generateStackXML(TEMPLATES.projectile));
        expect(note).toContain('v0={@v0@}');
        expect(note).toContain('theta={@theta@}');
        expect(note).toContain('ans1={@significantfigures(ta1,4)@}');
        expect(note).toContain('ans2={@significantfigures(ta2,4)@}');
        // NEVER the student input as a value (self-reference leaks nothing)
        expect(note).not.toContain('={@ans');
    });

    it('units answers are interpolated raw (stackunits renders its own units)', () => {
        const note = noteOf(generateStackXML(TEMPLATES.kinematics));
        expect(note).toContain('ans1={@ta1@}');
        expect(note).not.toContain('significantfigures(ta1');
    });

    it('possibly-zero numeric answers are not wrapped (matrix determinant)', () => {
        const note = noteOf(generateStackXML(TEMPLATES.matrix_operations));
        expect(note).toContain('ans3={@ta3@}');
    });

    it('MCQ notes reference the shuffled option list and stop being constant', () => {
        const note = noteOf(generateStackXML(TEMPLATES.mcq_primes));
        expect(note).toContain('ans1={@ta_ans1@}');
        const issues = validateQuestionData(TEMPLATES.mcq_primes);
        expect(issues.some(i => i.code === 'W-NOTE-01')).toBe(false);
    });

    it('fixes the zero-rand empty-note edge', () => {
        const data = {
            name: 'Static', questionText: 'Q {@ta1@}',
            variables: [{ name: 'ta1', type: 'calc', value: '42' }],
            parts: [{
                id: 1, type: 'numerical', text: 'A:', answer: 'ans1', teacherAnswer: 'ta1',
                grading: { tolType: 'absolute', tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            }],
            images: [], generalFeedback: '', hints: [],
        };
        expect(questionNoteContent(data)).not.toBe('');
        expect(questionNoteContent(data)).toContain('ans1={@significantfigures(ta1,4)@}');
    });

    it('notes parts are skipped (placeholder answers are noise)', () => {
        const note = noteOf(generateStackXML(TEMPLATES.show_reasoning));
        expect(note).not.toContain('notes2=');
        expect(note).not.toContain('notes5=');
        expect(note).toContain('ans1={@significantfigures(ta1,4)@}');
    });
});
