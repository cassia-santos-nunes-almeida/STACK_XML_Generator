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
            partContent += `<div>[[input:${p.answer}]]</div>`;
            partContent += `<div style="margin-top:4px"><small style="color:#6b7280"><em>The box below shows how your answer was interpreted. Please verify it matches what you intended before submitting.</em></small></div>`;
            partContent += `<div>[[validation:${p.answer}]]</div>`;
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
    // Auto-generate contextual hints if teacher hasn't added any
    const hintTexts = (data.hints && data.hints.length > 0)
        ? data.hints
        : generateAutoHints(parts);

    const hints = hintTexts.map(h => `
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
    <defaultgrade>${data.defaultGrade ?? (parts.length || 1)}</defaultgrade>
    <penalty>${data.penalty ?? 0.1}</penalty>
    <hidden>0</hidden>
${hints}`;
}

/**
 * Generates automatic hints based on the part types in the question.
 * These provide contextual guidance for students on retry attempts.
 */
function generateAutoHints(parts) {
    if (!parts || parts.length === 0) return [];

    const hints = [];
    const types = new Set(parts.map(p => p.type));

    // First hint: general approach guidance
    hints.push('Review the problem statement carefully and identify the key quantities and relationships involved.');

    // Second hint: type-specific guidance
    const typeHints = [];

    if (types.has('numerical')) {
        const numParts = parts.filter(p => p.type === 'numerical');
        const hasSigFigs = numParts.some(p => p.grading?.checkSigFigs);
        const sigFigs = numParts.find(p => p.grading?.checkSigFigs)?.grading?.sigFigs;

        let numHint = 'For numerical answers: check your arithmetic and make sure you are using the correct formula.';
        if (hasSigFigs && sigFigs) {
            numHint += ` Your answer should be given to ${sigFigs} significant figures.`;
        }
        numHint += ' If your answer involves scientific notation, enter it as e.g. <code>3.5E-3</code> or <code>3.5*10^(-3)</code>.';
        typeHints.push(numHint);
    }

    if (types.has('algebraic')) {
        typeHints.push(
            'For algebraic answers: enter expressions using standard notation. ' +
            'Use <code>*</code> for multiplication (e.g. <code>2*x</code>), <code>^</code> for powers (e.g. <code>x^2</code>), ' +
            'and <code>sqrt(x)</code>, <code>sin(x)</code>, <code>exp(x)</code> for functions. ' +
            'Your answer will be checked for algebraic equivalence, so <code>x^2+2*x+1</code> and <code>(x+1)^2</code> are both accepted.'
        );
    }

    if (types.has('units')) {
        typeHints.push(
            'For answers with units: make sure to include the correct units. ' +
            'Enter values as e.g. <code>9.81*m/s^2</code> or <code>1500*kg</code>. ' +
            'Check that your unit conversions are correct &mdash; a common mistake is being off by a power of 10.'
        );
    }

    if (types.has('matrix')) {
        typeHints.push(
            'For matrix answers: enter your matrix using Maxima syntax, e.g. <code>matrix([1,2],[3,4])</code> for a 2&times;2 matrix. ' +
            'Make sure the dimensions match what is expected.'
        );
    }

    if (types.has('jsxgraph')) {
        typeHints.push(
            'For the interactive graph: make sure you have placed all required points. ' +
            'You can use the reset button to start over if needed.'
        );
    }

    if (typeHints.length > 0) {
        hints.push(typeHints.join(' '));
    }

    // Third hint: check your work
    if (types.has('numerical') || types.has('units')) {
        hints.push('Double-check your calculation by substituting your answer back into the original equation. Pay attention to units and orders of magnitude.');
    }

    return hints;
}
