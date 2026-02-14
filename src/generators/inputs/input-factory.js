// Factory that dispatches to the correct input generator based on answer type
import { INPUT_TYPES } from '../../core/constants.js';
import { generateNumericalInput } from './numerical-input.js';
import { generateAlgebraicInput } from './algebraic-input.js';
import { generateUnitsInput } from './units-input.js';
import { generateRadioInput } from './radio-input.js';
import { generateMatrixInput } from './matrix-input.js';
import { generateStringInput } from './string-input.js';
import { generateJSXGraphInput } from './jsxgraph-input.js';
import { generateNotesInput } from './notes-input.js';

/**
 * Generates the <input> XML element for a given part.
 *
 * @param {object} part - Part data object
 * @returns {string} XML string for the <input> element
 */
export function generateInput(part) {
    switch (part.type) {
        case INPUT_TYPES.NUMERICAL:
            return generateNumericalInput(part);
        case INPUT_TYPES.ALGEBRAIC:
            return generateAlgebraicInput(part);
        case INPUT_TYPES.UNITS:
            return generateUnitsInput(part);
        case INPUT_TYPES.RADIO:
            return generateRadioInput(part);
        case INPUT_TYPES.MATRIX:
            return generateMatrixInput(part);
        case INPUT_TYPES.STRING:
            return generateStringInput(part);
        case INPUT_TYPES.JSXGRAPH:
            return generateJSXGraphInput(part);
        case INPUT_TYPES.NOTES:
            return generateNotesInput(part);
        default:
            return generateAlgebraicInput(part);
    }
}
