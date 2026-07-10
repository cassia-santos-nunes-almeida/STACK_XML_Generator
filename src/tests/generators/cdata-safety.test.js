// @vitest-environment jsdom
// Premortem F1: teacher text containing "]]>" (e.g. the natural array-index
// inequality "a[b[1]]>0") must never produce malformed XML. Every CDATA
// emission routes through the ]]>-splitting cdata() helper, and the export
// path re-parses the generated string as a final gate.
import { describe, it, expect } from 'vitest';
import { generateStackXML } from '../../generators/xml-generator.js';
import { xmlWellFormedError } from '../../generators/xml-helpers.js';

const HOSTILE = 'If a[b[1]]>0 then the sequence diverges.';

function baseQuestion(overrides = {}) {
    return {
        name: 'CDATA hostile',
        questionText: 'Plain text',
        variables: [
            { name: 'ta1', type: 'calc', value: '42' },
        ],
        parts: [{
            id: 1,
            type: 'numerical',
            text: 'Compute.',
            answer: 'ans1',
            teacherAnswer: 'ta1',
            grading: { tolType: 'absolute', tightTol: 0.1, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        }],
        generalFeedback: '',
        hints: [],
        images: [],
        ...overrides,
    };
}

function parseOrError(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    return { doc, err: doc.querySelector('parsererror') };
}

describe('CDATA safety (]]> in teacher text)', () => {
    it('question text with ]]> stays well-formed and roundtrips', () => {
        const xml = generateStackXML(baseQuestion({ questionText: HOSTILE }));
        const { doc, err } = parseOrError(xml);
        expect(err).toBeNull();
        expect(doc.querySelector('questiontext text').textContent).toContain(HOSTILE);
    });

    it('part text with ]]> stays well-formed', () => {
        const q = baseQuestion();
        q.parts[0].text = HOSTILE;
        const xml = generateStackXML(q);
        const { doc, err } = parseOrError(xml);
        expect(err).toBeNull();
        expect(doc.querySelector('questiontext text').textContent).toContain(HOSTILE);
    });

    it('general feedback with ]]> stays well-formed', () => {
        const xml = generateStackXML(baseQuestion({ generalFeedback: HOSTILE }));
        const { doc, err } = parseOrError(xml);
        expect(err).toBeNull();
        expect(doc.querySelector('generalfeedback text').textContent).toContain(HOSTILE);
    });

    it('hint with ]]> stays well-formed', () => {
        const xml = generateStackXML(baseQuestion({ hints: [HOSTILE] }));
        const { doc, err } = parseOrError(xml);
        expect(err).toBeNull();
        expect(doc.querySelector('hint text').textContent).toContain(HOSTILE);
    });

    it('part feedback with ]]> stays well-formed', () => {
        const q = baseQuestion();
        q.parts[0].feedback = { incorrect: HOSTILE };
        const xml = generateStackXML(q);
        const { err } = parseOrError(xml);
        expect(err).toBeNull();
    });

    it('jsxgraph grading code with ]]> stays well-formed under a prerequisite gate', () => {
        const q = baseQuestion();
        q.parts.push({
            id: 2,
            type: 'jsxgraph',
            text: 'Sketch.',
            answer: 'ans2',
            teacherAnswer: 'ta1',
            prerequisite: 1,
            grading: { tightTol: 0.1, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false },
            options: [],
            graphCode: 'var p = board.create("point", [0, 0]);',
            gradingCode: 'all_correct: is(arr[idx[1]]>0);',
            feedback: {},
        });
        const xml = generateStackXML(q);
        const { doc, err } = parseOrError(xml);
        expect(err).toBeNull();
        // The prerequisite merge must not truncate the grading code
        const fvs = Array.from(doc.querySelectorAll('feedbackvariables text')).map(n => n.textContent).join('\n');
        expect(fvs).toContain('all_correct: is(arr[idx[1]]>0);');
        expect(fvs).toContain('prereq_passed');
    });

    it('companion (exam mode) custom text with ]]> stays well-formed', () => {
        const xml = generateStackXML(baseQuestion({
            examMode: true,
            companionGrade: 0,
            companionAttachments: 1,
            companionText: HOSTILE,
        }));
        const { doc, err } = parseOrError(xml);
        expect(err).toBeNull();
        const essayText = doc.querySelectorAll('question[type="essay"] questiontext text');
        expect(essayText.length).toBe(1);
        expect(essayText[0].textContent).toContain(HOSTILE);
    });

    it('xmlWellFormedError reports malformed XML and passes good XML', () => {
        expect(xmlWellFormedError('<a><b>ok</b></a>')).toBeNull();
        expect(xmlWellFormedError('<a><![CDATA[x]]>y]]></a>')).not.toBeNull();
    });
});
