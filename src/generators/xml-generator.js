// Main XML generator — thin orchestrator that assembles all parts
// This replaces the monolithic old xml-generator.js
import { generateQuestionHeader } from './question-header.js';
import { generateQuestionVariables } from './question-variables.js';
import { generateInput } from './inputs/input-factory.js';
import { generatePRT } from './prts/prt-factory.js';

/**
 * Generates complete STACK question XML for Moodle import.
 *
 * @param {object} data - Full question data object
 * @returns {string} Complete XML string ready for Moodle import
 */
export function generateStackXML(data) {
    // 1. Question header (name, text, images, generalfeedback, hints)
    let xml = generateQuestionHeader(data);

    // 2. Question variables (Maxima code)
    xml += generateQuestionVariables(data);

    // 3. Specific feedback (empty by default, STACK uses PRT feedback)
    xml += `
    <specificfeedback format="html">
      <text><![CDATA[${(data.parts || []).map(p => `[[feedback:prt${p.id}]]`).join('\n')}]]></text>
    </specificfeedback>`;

    // 4. Question note (for variant tracking)
    const noteVars = (data.variables || [])
        .filter(v => v.type === 'rand')
        .map(v => `{@${v.name}@}`)
        .join(', ');
    xml += `
    <questionnote format="html">
      <text><![CDATA[${noteVars}]]></text>
    </questionnote>`;

    // 5. Input elements (one per part)
    (data.parts || []).forEach(p => {
        xml += generateInput(p);
    });

    // 6. PRT elements (one per part — grading logic)
    (data.parts || []).forEach((p, idx) => {
        xml += generatePRT(p, idx);
    });

    // 7. Close question
    xml += `
  </question>
</quiz>`;

    return xml;
}
