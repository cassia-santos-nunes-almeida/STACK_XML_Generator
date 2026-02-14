// Generates the <questionvariables> XML section
import { cdata } from './xml-helpers.js';
import { generateRadioVariable } from './inputs/radio-input.js';
import { INPUT_TYPES } from '../core/constants.js';

/**
 * Generates the question variables XML block.
 *
 * Includes:
 * - User-defined variables (rand, calc, algebraic)
 * - Auto-generated helper variables for MCQ (radio) inputs (FIXES BUG 4)
 *
 * @param {object} data - Full question data with .variables and .parts
 * @returns {string} XML string for <questionvariables>
 */
export function generateQuestionVariables(data) {
    const lines = [];

    // User-defined variables
    (data.variables || []).forEach(v => {
        // Ensure value ends with semicolon for Maxima
        let val = (v.value || '').trim();
        if (!val.endsWith(';')) val += ';';
        lines.push(`${v.name}: ${val}`);
    });

    // Auto-generated variables for MCQ/radio parts (FIXES BUG 4)
    (data.parts || []).forEach(p => {
        if (p.type === INPUT_TYPES.RADIO && p.options && p.options.length > 0) {
            lines.push(generateRadioVariable(p) + ';');
        }
    });

    // Teacher-answer aliases for power-of-10 detection and prerequisite checking
    // In PRT feedbackvariables, the student input shadows the question variable with
    // the same name (e.g., ans1). This alias captures the teacher answer before that.
    const needsTansAlias = new Set();
    (data.parts || []).forEach(p => {
        if (p.grading?.checkPowerOf10 && p.answer) {
            needsTansAlias.add(p.answer);
        }
    });
    // Also add aliases for parts that are prerequisites (needed by prerequisite check)
    (data.parts || []).forEach(p => {
        if (p.prerequisite) {
            const prereqPart = (data.parts || []).find(pp => pp.id === p.prerequisite);
            if (prereqPart && (prereqPart.type === 'numerical' || prereqPart.type === 'units')) {
                needsTansAlias.add(prereqPart.answer);
            }
        }
    });
    needsTansAlias.forEach(answer => {
        lines.push(`tans_${answer}: ${answer};`);
    });

    // Notes parts need a placeholder answer variable
    (data.parts || []).forEach(p => {
        if (p.type === INPUT_TYPES.NOTES && p.answer) {
            // Only add if user hasn't defined this variable themselves
            const userDefined = (data.variables || []).some(v => v.name === p.answer);
            if (!userDefined) {
                lines.push(`${p.answer}: "Your reasoning here";`);
            }
        }
    });

    const content = lines.join('\n');

    return `
    <questionvariables>
      <text>${cdata(content)}</text>
    </questionvariables>`;
}
