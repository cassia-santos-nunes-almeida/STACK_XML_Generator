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

    const content = lines.join('\n');

    return `
    <questionvariables>
      <text>${cdata(content)}</text>
    </questionvariables>`;
}
