// @vitest-environment jsdom
// Premortem F7: castext expressions like {@2*ta1@} were invisible to both
// the validator and the preview — the preview showed raw text while Moodle
// computes a value, with no hint that the two differ.
import { describe, it, expect } from 'vitest';
import { validateQuestionData } from '../../core/validators.js';
import { processText } from '../../ui/render-preview.js';

function q(text) {
    return {
        name: 'Castext expr',
        questionText: text,
        variables: [{ name: 'ta1', type: 'calc', value: '42' }],
        parts: [{
            id: 1, type: 'numerical', text: 'Value?', answer: 'ans1',
            teacherAnswer: 'ta1',
            grading: { tolType: 'absolute', tightTol: 0.1, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        }],
        generalFeedback: '', hints: [], images: [],
    };
}

describe('castext expression visibility (F7)', () => {
    it('a non-identifier {@...@} raises W-VAR-06', () => {
        const issues = validateQuestionData(q('Value {@2*ta1@}'));
        const hit = issues.find(i => i.code === 'W-VAR-06');
        expect(hit).toBeTruthy();
        expect(hit.level).toBe('warning');
        expect(hit.message).toContain('2*ta1');
    });

    it('a defined bare identifier raises no W-VAR-06', () => {
        const issues = validateQuestionData(q('Value {@ta1@}'));
        expect(issues.map(i => i.code)).not.toContain('W-VAR-06');
    });

    it('an undefined identifier stays W-VAR-05, not W-VAR-06', () => {
        const issues = validateQuestionData(q('Value {@nope@}'));
        const codes = issues.map(i => i.code);
        expect(codes).toContain('W-VAR-05');
        expect(codes).not.toContain('W-VAR-06');
    });

    it('preview marks a non-identifier expression as not previewable', () => {
        const html = processText('Value {@2*ta1@}', { ta1: 42 }, []);
        expect(html).toContain('unpreviewable-expr');
        expect(html).toContain('2*ta1');
        // and it must NOT pretend to substitute it
        expect(html).not.toContain('substituted-var" title="2*ta1');
    });

    it('preview still substitutes plain identifiers', () => {
        const html = processText('Value {@ta1@}', { ta1: 42 }, []);
        expect(html).toContain('substituted-var');
        expect(html).toContain('42');
        expect(html).not.toContain('unpreviewable-expr');
    });
});
