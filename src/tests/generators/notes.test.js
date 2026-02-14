import { describe, it, expect } from 'vitest';
import { generateNotesInput } from '../../generators/inputs/notes-input.js';
import { generateNotesPRT } from '../../generators/prts/notes-prt.js';
import { generateInput } from '../../generators/inputs/input-factory.js';
import { generatePRT } from '../../generators/prts/prt-factory.js';
import { generateStackXML } from '../../generators/xml-generator.js';

const notesPart = {
    id: 2,
    type: 'notes',
    text: 'Explain your reasoning:',
    answer: 'ans2',
    grading: {},
    options: [],
    graphCode: '',
    gradingCode: '',
    feedback: {},
    prerequisite: null,
    notesAutoCredit: true,
    notesRequireImage: false,
    notesBoxSize: 6,
    notesSyntaxHint: '',
};

describe('Notes Input Generator', () => {
    it('emits notes type', () => {
        const xml = generateNotesInput(notesPart);
        expect(xml).toContain('<type>notes</type>');
    });

    it('uses answer variable for name and tans', () => {
        const xml = generateNotesInput(notesPart);
        expect(xml).toContain('<name>ans2</name>');
        expect(xml).toContain('<tans>ans2</tans>');
    });

    it('disables validation display', () => {
        const xml = generateNotesInput(notesPart);
        expect(xml).toContain('<mustverify>0</mustverify>');
        expect(xml).toContain('<showvalidation>0</showvalidation>');
    });

    it('uses configurable boxsize', () => {
        const part = { ...notesPart, notesBoxSize: 10 };
        const xml = generateNotesInput(part);
        expect(xml).toContain('<boxsize>10</boxsize>');
    });

    it('defaults boxsize to 6', () => {
        const xml = generateNotesInput(notesPart);
        expect(xml).toContain('<boxsize>6</boxsize>');
    });

    it('includes syntax hint when provided', () => {
        const part = { ...notesPart, notesSyntaxHint: 'Show your steps' };
        const xml = generateNotesInput(part);
        expect(xml).toContain('<syntaxhint>Show your steps</syntaxhint>');
    });
});

describe('Notes PRT Generator', () => {
    it('uses AlgEquiv with 1=1 (always true)', () => {
        const xml = generateNotesPRT(notesPart, 'prt2');
        expect(xml).toContain('<answertest>AlgEquiv</answertest>');
        expect(xml).toContain('<sans>1</sans>');
        expect(xml).toContain('<tans>1</tans>');
    });

    it('awards full marks when autoCredit is true', () => {
        const xml = generateNotesPRT(notesPart, 'prt2');
        expect(xml).toContain('<truescore>1</truescore>');
    });

    it('awards zero marks when autoCredit is false', () => {
        const part = { ...notesPart, notesAutoCredit: false };
        const xml = generateNotesPRT(part, 'prt2');
        expect(xml).toContain('<truescore>0</truescore>');
    });

    it('is quiet (does not show test result)', () => {
        const xml = generateNotesPRT(notesPart, 'prt2');
        expect(xml).toContain('<quiet>1</quiet>');
    });

    it('includes acknowledgement feedback', () => {
        const xml = generateNotesPRT(notesPart, 'prt2');
        expect(xml).toContain('Thank you for showing your reasoning');
    });
});

describe('Notes via Input Factory', () => {
    it('dispatches notes type correctly', () => {
        const xml = generateInput(notesPart);
        expect(xml).toContain('<type>notes</type>');
    });
});

describe('Notes via PRT Factory', () => {
    it('dispatches notes type correctly', () => {
        const xml = generatePRT(notesPart, 1, [notesPart]);
        expect(xml).toContain('<name>prt2</name>');
        expect(xml).toContain('<sans>1</sans>');
    });
});

describe('Notes in Full XML Generation', () => {
    const fullData = {
        name: 'Question with Reasoning',
        questionText: 'Solve the problem and explain your approach.',
        variables: [
            { name: 'a', type: 'rand', value: 'rand(10)+1' },
            { name: 'ans1', type: 'calc', value: 'a * 2' },
        ],
        parts: [
            {
                id: 1, type: 'numerical', text: 'Calculate:', answer: 'ans1',
                grading: { tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '', feedback: {},
                prerequisite: null, notesAutoCredit: true, notesRequireImage: false, notesBoxSize: 6, notesSyntaxHint: '',
            },
            {
                ...notesPart,
                notesRequireImage: true,
            },
        ],
        images: [],
        generalFeedback: '',
        hints: [],
    };

    it('generates notes input in XML', () => {
        const xml = generateStackXML(fullData);
        expect(xml).toContain('<type>notes</type>');
    });

    it('generates placeholder answer variable for notes part', () => {
        const xml = generateStackXML(fullData);
        expect(xml).toContain('ans2: "Your reasoning here"');
    });

    it('includes image upload instruction when notesRequireImage is true', () => {
        const xml = generateStackXML(fullData);
        expect(xml).toContain('photograph or scan your handwritten calculations');
    });

    it('does not include image instruction when notesRequireImage is false', () => {
        const dataNoImage = {
            ...fullData,
            parts: [fullData.parts[0], { ...notesPart, notesRequireImage: false }],
        };
        const xml = generateStackXML(dataNoImage);
        expect(xml).not.toContain('photograph or scan your handwritten calculations');
    });

    it('generates auto-hint for notes type', () => {
        const xml = generateStackXML(fullData);
        expect(xml).toContain('reasoning parts');
    });
});
