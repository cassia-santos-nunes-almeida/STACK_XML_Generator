import { describe, it, expect } from 'vitest';
import { generateEssayQuestion, defaultEssayText } from '../../generators/essay-generator.js';
import { generateStackXML } from '../../generators/xml-generator.js';

describe('Essay Generator', () => {
    const baseData = {
        name: 'Test Question',
        questionText: 'Calculate something.',
        variables: [],
        parts: [{
            id: 1, type: 'numerical', text: 'Answer:', answer: 'ans1',
            grading: { tightTol: 0.05, wideTol: 0.20, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        }],
        images: [],
        generalFeedback: '',
        hints: [],
    };

    describe('generateEssayQuestion', () => {
        it('returns empty string when essayEnabled is false', () => {
            const data = { ...baseData, essayEnabled: false };
            expect(generateEssayQuestion(data)).toBe('');
        });

        it('returns empty string when essayEnabled is undefined', () => {
            expect(generateEssayQuestion(baseData)).toBe('');
        });

        it('generates essay XML when enabled', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<question type="essay">');
            expect(xml).toContain('</question>');
        });

        it('uses _handwritten_notes suffix in essay name', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('Test Question_handwritten_notes');
        });

        it('auto-generates student instruction text when essayText is empty', () => {
            const data = { ...baseData, essayEnabled: true, essayText: '' };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('Test Question');
            expect(xml).toContain('handwritten calculations');
        });

        it('uses custom essayText when provided', () => {
            const data = { ...baseData, essayEnabled: true, essayText: 'Please upload your diagram.' };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('Please upload your diagram.');
        });

        it('defaults grade to 0', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<defaultgrade>0</defaultgrade>');
        });

        it('uses custom grade when specified', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 5 };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<defaultgrade>5</defaultgrade>');
        });

        it('defaults attachments to 1', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<attachments>1</attachments>');
        });

        it('uses custom attachment count', () => {
            const data = { ...baseData, essayEnabled: true, essayAttachments: 3 };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<attachments>3</attachments>');
        });

        it('sets responseformat to noinline', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<responseformat>noinline</responseformat>');
        });

        it('allows PDF, JPG, JPEG, PNG file types', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<filetypeslist>.pdf,.jpg,.jpeg,.png</filetypeslist>');
        });

        it('does not require response text', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<responserequired>0</responserequired>');
        });

        it('requires at least 1 attachment', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<attachmentsrequired>1</attachmentsrequired>');
        });

        it('includes maxbytes field', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<maxbytes>0</maxbytes>');
        });

        it('includes teacher setup reminder in default question text', () => {
            const data = { ...baseData, essayEnabled: true, essayText: '' };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('TEACHER ACTION REQUIRED');
            expect(xml).toContain('DELETE THIS NOTICE BEFORE THE QUIZ RUNS');
        });

        it('includes grader info referencing parent question', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<graderinfo format="html">');
            expect(xml).toContain('Test Question');
            expect(xml).toContain('Correct method');
            expect(xml).toContain('intermediate steps');
            expect(xml).toContain('diagram');
            expect(xml).toContain('units');
        });

        it('sets responsefieldlines to 5', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<responsefieldlines>5</responsefieldlines>');
        });
    });

    describe('defaultEssayText', () => {
        it('includes question name', () => {
            expect(defaultEssayText('My Question')).toContain('My Question');
        });

        it('uses fallback when name is empty', () => {
            expect(defaultEssayText('')).toContain('this question');
        });

        it('includes teacher setup reminder', () => {
            const text = defaultEssayText('Q1');
            expect(text).toContain('TEACHER ACTION REQUIRED');
        });
    });

    describe('Integration with generateStackXML', () => {
        it('does not include essay when disabled', () => {
            const data = { ...baseData, essayEnabled: false };
            const xml = generateStackXML(data);

            expect(xml).not.toContain('<question type="essay">');
            // Should still have the STACK question
            expect(xml).toContain('<question type="stack">');
        });

        it('appends essay question after STACK question when enabled', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 2 };
            const xml = generateStackXML(data);

            expect(xml).toContain('<question type="stack">');
            expect(xml).toContain('<question type="essay">');

            // Essay should come after STACK question closes
            const stackEnd = xml.indexOf('</question>');
            const essayStart = xml.indexOf('<question type="essay">');
            expect(essayStart).toBeGreaterThan(stackEnd);

            // Both wrapped in quiz
            expect(xml).toContain('</quiz>');
        });

        it('essay uses configured grade in full XML', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 10 };
            const xml = generateStackXML(data);

            expect(xml).toContain('<defaultgrade>10</defaultgrade>');
        });

        it('main question XML content unchanged when essay enabled', () => {
            const xmlWithout = generateStackXML({ ...baseData, essayEnabled: false });
            const xmlWith = generateStackXML({ ...baseData, essayEnabled: true });

            // Extract STACK question portion (before essay or closing quiz tag)
            const stackEndWithout = xmlWithout.indexOf('</question>') + '</question>'.length;
            const stackEndWith = xmlWith.indexOf('</question>') + '</question>'.length;

            const stackPartWithout = xmlWithout.substring(0, stackEndWithout);
            const stackPartWith = xmlWith.substring(0, stackEndWith);

            expect(stackPartWith).toBe(stackPartWithout);
        });

        it('output is valid XML structure when essay enabled', () => {
            const data = { ...baseData, essayEnabled: true };
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
            const data = { ...baseData, essayEnabled: true };
            const xml = generateStackXML(data);

            expect(xml).toContain('Test Question_handwritten_notes');
        });

        it('companion attachmentsrequired is 1 in full XML', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateStackXML(data);

            expect(xml).toContain('<attachmentsrequired>1</attachmentsrequired>');
        });

        it('companion defaultgrade is 0 when essayGrade is 0', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 0 };
            const xml = generateStackXML(data);

            // Find the essay question's defaultgrade (second occurrence)
            const essayStart = xml.indexOf('<question type="essay">');
            const essayPortion = xml.substring(essayStart);
            expect(essayPortion).toContain('<defaultgrade>0</defaultgrade>');
        });

        it('companion defaultgrade is 2 when essayGrade is 2', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 2 };
            const xml = generateStackXML(data);

            const essayStart = xml.indexOf('<question type="essay">');
            const essayPortion = xml.substring(essayStart);
            expect(essayPortion).toContain('<defaultgrade>2</defaultgrade>');
        });

        it('teacher setup reminder present in companion questiontext', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateStackXML(data);

            const essayStart = xml.indexOf('<question type="essay">');
            const essayPortion = xml.substring(essayStart);
            expect(essayPortion).toContain('TEACHER ACTION REQUIRED');
        });
    });

    describe('With different input types', () => {
        it('generates companion for algebraic input parent', () => {
            const data = {
                ...baseData,
                essayEnabled: true,
                parts: [{
                    id: 1, type: 'algebraic', text: 'Simplify:', answer: 'ans1',
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
                essayEnabled: true,
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
    });
});
