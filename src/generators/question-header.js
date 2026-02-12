// Generates the question-level XML: name, questiontext, generalfeedback, hints
// FIXES BUG 5: No longer duplicates images inside CDATA
import { escapeXml, convertMathDelimiters } from './xml-helpers.js';

/**
 * Generates the question header XML including name, text, images, and feedback.
 *
 * @param {object} data - Full question data
 * @returns {string} XML from <question> opening through </questiontext>
 */
export function generateQuestionHeader(data) {
    const parts = data.parts || [];

    // Build the parts HTML content
    const partsHtml = parts.map(p => {
        let partContent = `<div class="stack-part">`;
        const label = String.fromCharCode(96 + p.id);
        partContent += `<p><strong>(${label})</strong> ${convertMathDelimiters(p.text || '')}</p>`;

        if (p.type === 'jsxgraph') {
            partContent += `<div class="jsxgraph-box">
[[jsxgraph input-ref-${p.answer}="${p.answer}Ref" width="500px" height="400px"]]
${p.graphCode || ''}
[[/jsxgraph]]
</div>
<p style="display:none">[[input:${p.answer}]] [[validation:${p.answer}]]</p>`;
        } else {
            partContent += `<div>[[input:${p.answer}]] [[validation:${p.answer}]]</div>`;
        }

        partContent += `</div>`;
        return partContent;
    }).join('\n\n');

    // Build image file elements (OUTSIDE CDATA — proper Moodle format)
    const imageFiles = (data.images || []).map(img => {
        const b64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;
        return `      <file name="${escapeXml(img.name)}" encoding="base64">${b64Data}</file>`;
    }).join('\n');

    // General feedback (worked solution)
    const generalFeedback = data.generalFeedback || '';

    // Hints for multi-attempt questions
    const hints = (data.hints || []).map(h => `
    <hint format="html">
      <text><![CDATA[${convertMathDelimiters(h)}]]></text>
    </hint>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>${escapeXml(data.name || 'Untitled Question')}</text></name>
    <questiontext format="html">
      <text><![CDATA[${convertMathDelimiters(data.questionText || '')}

${partsHtml}]]></text>
${imageFiles}
    </questiontext>

    <generalfeedback format="html">
      <text><![CDATA[${convertMathDelimiters(generalFeedback)}]]></text>
    </generalfeedback>
    <defaultgrade>${parts.length || 1}</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>
${hints}`;
}
