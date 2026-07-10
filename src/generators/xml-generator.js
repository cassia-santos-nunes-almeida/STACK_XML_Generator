// Main XML generator — thin orchestrator that assembles all parts
// This replaces the monolithic old xml-generator.js
import { generateQuestionHeader } from './question-header.js';
import { generateQuestionVariables } from './question-variables.js';
import { generateInput } from './inputs/input-factory.js';
import { generatePRT } from './prts/prt-factory.js';
import { generateCompanionNotesQuestion } from './companion-question.js';
import { generateDeployedSeeds, generateQuestionTests } from './qtest-generator.js';
import { questionNoteContent } from './question-note.js';
import { cdataRaw } from './xml-helpers.js';
import STACK_RULES from '../core/stack-rules.json' with { type: 'json' };

/**
 * Generates complete STACK question XML for Moodle import.
 *
 * @param {object} data - Full question data object
 * @returns {string} Complete XML string ready for Moodle import
 */
export function generateStackXML(data) {
    // 1. Question header (name, text, images, generalfeedback, hints)
    let xml = generateQuestionHeader(data);

    // 1.5 Version stamp (A4). MUST stay <text>-wrapped: the importer reads
    // stackversion through a <text> child; the unwrapped shorthand imports
    // as version 0 and re-activates legacy castext checks (F-1, v4.9.1
    // questiontype.php:1370). The stamp constant lives ONLY in stack-rules.json.
    xml += `
    <stackversion><text>${STACK_RULES.stackVersion}</text></stackversion>`;

    // 2. Question variables (Maxima code)
    xml += generateQuestionVariables(data);

    // 3. Specific feedback (empty by default, STACK uses PRT feedback)
    xml += `
    <specificfeedback format="html">
      <text>${cdataRaw((data.parts || []).map(p => `[[feedback:prt${p.id}]]`).join('\n'))}</text>
    </specificfeedback>`;

    // 4. Question note (for variant tracking) — content comes from the ONE
    // builder the A6 completeness check also reads (question-note.js).
    xml += `
    <questionnote format="html">
      <text>${cdataRaw(questionNoteContent(data))}</text>
    </questionnote>`;

    // 5. Input elements (one per part)
    (data.parts || []).forEach(p => {
        xml += generateInput(p);
    });

    // 6. PRT elements (one per part — grading logic). The context lets
    // numerical/units PRTs evaluate the teacher answer across the rand
    // space (A11 degenerate-zero fallback).
    const allParts = data.parts || [];
    const ctx = { variables: data.variables || [] };
    const prtBlocks = allParts.map((p, idx) => ({
        part: p,
        prtName: `prt${p.id || idx + 1}`,
        xml: generatePRT(p, idx, allParts, ctx),
    }));
    prtBlocks.forEach(b => { xml += b.xml; });

    // 7. Deployed seeds + question tests (A5, P-STACK-61 doctrine): seeds
    // only when the question actually randomises; qtest expectations are
    // derived by walking the PRT node graphs emitted above.
    xml += generateDeployedSeeds(data);
    xml += generateQuestionTests(data, prtBlocks);

    // 8. Close STACK question
    xml += `
  </question>`;

    // 9. Optional companion handwritten notes question (exam mode)
    if (data.examMode) {
        xml += generateCompanionNotesQuestion(
            data.name,
            data.name,
            data.companionGrade,
            { customText: data.companionText, attachments: data.companionAttachments }
        );
    }

    // 10. Close quiz wrapper
    xml += `
</quiz>`;

    return xml;
}
