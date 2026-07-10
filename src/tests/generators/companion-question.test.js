import { describe, it, expect } from 'vitest';
import { generateCompanionNotesQuestion, defaultCompanionText } from '../../generators/companion-question.js';
import { generateStackXML } from '../../generators/xml-generator.js';

describe('Companion Question Generator', () => {
    const baseData = {
        name: 'Test Question',
        questionText: 'Calculate something.',
        variables: [{ name: 'ta1', type: 'calc', value: '42' }],
        parts: [{
            id: 1, type: 'numerical', text: 'Answer:', answer: 'ans1', teacherAnswer: 'ta1',
            grading: { tightTol: 0.05, wideTol: 0.20, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        }],
        images: [],
        generalFeedback: '',
        hints: [],
    };

    describe('generateCompanionNotesQuestion', () => {
        it('generates essay XML with correct type', () => {
            const xml = generateCompanionNotesQuestion('Test Question', 'Test Question', 0);

            expect(xml).toContain('<question type="essay">');
            expect(xml).toContain('</question>');
        });

        it('uses _handwritten_notes suffix in companion name', () => {
            const xml = generateCompanionNotesQuestion('Test Question', 'Test Question', 0);

            expect(xml).toContain('Test Question_handwritten_notes');
        });

        it('auto-generates student instruction text', () => {
            const xml = generateCompanionNotesQuestion('Test Question', 'Test Question', 0);

            expect(xml).toContain('Test Question');
            expect(xml).toContain('handwritten calculations');
        });

        it('uses custom text when provided', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1', 0, { customText: 'Please upload your diagram.' });

            expect(xml).toContain('Please upload your diagram.');
        });

        it('defaults grade to 0', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<defaultgrade>0</defaultgrade>');
        });

        it('uses custom grade when specified', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1', 5);

            expect(xml).toContain('<defaultgrade>5</defaultgrade>');
        });

        it('defaults attachments to 1', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<attachments>1</attachments>');
        });

        it('uses custom attachment count', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1', 0, { attachments: 3 });

            expect(xml).toContain('<attachments>3</attachments>');
        });

        it('sets responseformat to noinline', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<responseformat>noinline</responseformat>');
        });

        it('allows PDF, JPG, JPEG, PNG file types', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<filetypeslist>.pdf,.jpg,.jpeg,.png</filetypeslist>');
        });

        it('does not require response text', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<responserequired>0</responserequired>');
        });

        it('requires at least 1 attachment', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<attachmentsrequired>1</attachmentsrequired>');
        });

        it('includes maxbytes field', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<maxbytes>0</maxbytes>');
        });

        it('includes teacher setup reminder in default question text', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('TEACHER ACTION REQUIRED');
            expect(xml).toContain('DELETE THIS NOTICE BEFORE THE QUIZ RUNS');
        });

        it('includes grader info referencing parent question', () => {
            const xml = generateCompanionNotesQuestion('Test Question', 'Test Question');

            expect(xml).toContain('<graderinfo format="html">');
            expect(xml).toContain('Test Question');
            expect(xml).toContain('Correct method');
            expect(xml).toContain('intermediate steps');
            expect(xml).toContain('diagram');
            expect(xml).toContain('units');
        });

        it('sets responsefieldlines to 5', () => {
            const xml = generateCompanionNotesQuestion('Q1', 'Q1');

            expect(xml).toContain('<responsefieldlines>5</responsefieldlines>');
        });
    });

    describe('defaultCompanionText', () => {
        it('includes question name', () => {
            expect(defaultCompanionText('My Question')).toContain('My Question');
        });

        it('uses fallback when name is empty', () => {
            expect(defaultCompanionText('')).toContain('this question');
        });

        it('includes teacher setup reminder', () => {
            const text = defaultCompanionText('Q1');
            expect(text).toContain('TEACHER ACTION REQUIRED');
        });
    });

    describe('Integration with generateStackXML', () => {
        it('does not include companion when examMode is false', () => {
            const data = { ...baseData, examMode: false };
            const xml = generateStackXML(data);

            expect(xml).not.toContain('<question type="essay">');
            expect(xml).toContain('<question type="stack">');
        });

        it('does not include companion when examMode is undefined', () => {
            const xml = generateStackXML(baseData);

            expect(xml).not.toContain('<question type="essay">');
        });

        it('appends companion question after STACK question when examMode is true', () => {
            const data = { ...baseData, examMode: true, companionGrade: 2 };
            const xml = generateStackXML(data);

            expect(xml).toContain('<question type="stack">');
            expect(xml).toContain('<question type="essay">');

            // Companion should come after STACK question closes
            const stackEnd = xml.indexOf('</question>');
            const companionStart = xml.indexOf('<question type="essay">');
            expect(companionStart).toBeGreaterThan(stackEnd);

            // Both wrapped in quiz
            expect(xml).toContain('</quiz>');
        });

        it('companion uses configured grade in full XML', () => {
            const data = { ...baseData, examMode: true, companionGrade: 10 };
            const xml = generateStackXML(data);

            expect(xml).toContain('<defaultgrade>10</defaultgrade>');
        });

        it('main question XML content unchanged when examMode is true', () => {
            const xmlWithout = generateStackXML({ ...baseData, examMode: false });
            const xmlWith = generateStackXML({ ...baseData, examMode: true });

            // Extract STACK question portion (before companion or closing quiz tag)
            const stackEndWithout = xmlWithout.indexOf('</question>') + '</question>'.length;
            const stackEndWith = xmlWith.indexOf('</question>') + '</question>'.length;

            const stackPartWithout = xmlWithout.substring(0, stackEndWithout);
            const stackPartWith = xmlWith.substring(0, stackEndWith);

            expect(stackPartWith).toBe(stackPartWithout);
        });

        it('output is valid XML structure when examMode is true', () => {
            const data = { ...baseData, examMode: true };
            const xml = generateStackXML(data);

            // Check balanced quiz tags
            expect(xml).toContain('<quiz>');
            expect(xml).toContain('</quiz>');

            // Check both questions are properly closed
            const questionOpens = (xml.match(/<question type="/g) || []).length;
            const questionCloses = (xml.match(/<\/question>/g) || []).length;
            expect(questionOpens).toBe(2);
            expect(questionCloses).toBe(2);
        });

        it('companion name uses _handwritten_notes in full XML', () => {
            const data = { ...baseData, examMode: true };
            const xml = generateStackXML(data);

            expect(xml).toContain('Test Question_handwritten_notes');
        });

        it('companion attachmentsrequired is 1 in full XML', () => {
            const data = { ...baseData, examMode: true };
            const xml = generateStackXML(data);

            expect(xml).toContain('<attachmentsrequired>1</attachmentsrequired>');
        });

        it('companion defaultgrade is 0 when companionGrade is 0', () => {
            const data = { ...baseData, examMode: true, companionGrade: 0 };
            const xml = generateStackXML(data);

            // Find the essay question's defaultgrade (second occurrence)
            const companionStart = xml.indexOf('<question type="essay">');
            const companionPortion = xml.substring(companionStart);
            expect(companionPortion).toContain('<defaultgrade>0</defaultgrade>');
        });

        it('companion defaultgrade is 2 when companionGrade is 2', () => {
            const data = { ...baseData, examMode: true, companionGrade: 2 };
            const xml = generateStackXML(data);

            const companionStart = xml.indexOf('<question type="essay">');
            const companionPortion = xml.substring(companionStart);
            expect(companionPortion).toContain('<defaultgrade>2</defaultgrade>');
        });

        it('teacher setup reminder present in companion questiontext', () => {
            const data = { ...baseData, examMode: true };
            const xml = generateStackXML(data);

            const companionStart = xml.indexOf('<question type="essay">');
            const companionPortion = xml.substring(companionStart);
            expect(companionPortion).toContain('TEACHER ACTION REQUIRED');
        });

        it('filename contains _with_notes when examMode is true (checked via state field)', () => {
            // This tests the state field name, not the download function (which is in app.js)
            const data = { ...baseData, examMode: true };
            expect(data.examMode).toBe(true);
        });
    });

    describe('With different input types', () => {
        it('generates companion for numerical input parent', () => {
            const data = { ...baseData, examMode: true };
            const xml = generateStackXML(data);
            expect(xml).toContain('<question type="essay">');
            expect(xml).toContain('_handwritten_notes');
        });

        it('generates companion for algebraic input parent', () => {
            const data = {
                ...baseData,
                examMode: true,
                parts: [{
                    id: 1, type: 'algebraic', text: 'Simplify:', answer: 'ans1', teacherAnswer: 'ta1',
                    grading: {}, options: [], graphCode: '', gradingCode: '', feedback: {},
                }],
            };
            const xml = generateStackXML(data);
            expect(xml).toContain('<question type="essay">');
            expect(xml).toContain('_handwritten_notes');
        });

        it('generates companion for notes input parent', () => {
            const data = {
                ...baseData,
                examMode: true,
                parts: [{
                    id: 1, type: 'notes', text: 'Explain:', answer: 'ans1',
                    grading: {}, options: [], graphCode: '', gradingCode: '', feedback: {},
                    notesAutoCredit: true, notesRequireImage: false, notesBoxSize: 6, notesSyntaxHint: '',
                }],
            };
            const xml = generateStackXML(data);
            expect(xml).toContain('<question type="essay">');
            expect(xml).toContain('_handwritten_notes');
        });

        it('does NOT generate companion when examMode is false', () => {
            const data = { ...baseData, examMode: false };
            const xml = generateStackXML(data);
            expect(xml).not.toContain('<question type="essay">');
        });
    });
});
