// Factory that dispatches to the correct PRT generator based on answer type
import { INPUT_TYPES } from '../../core/constants.js';
import { generateNumericalPRT } from './numerical-prt.js';
import { generateUnitsPRT } from './units-prt.js';
import { generateAlgebraicPRT } from './algebraic-prt.js';
import { generateRadioPRT } from './radio-prt.js';
import { generateMatrixPRT } from './matrix-prt.js';
import { generateStringPRT } from './string-prt.js';
import { generateJSXGraphPRT } from './jsxgraph-prt.js';

/**
 * Generates the complete PRT XML block for a given part.
 *
 * @param {object} part - Part data object
 * @param {number} partIndex - 0-based index of the part
 * @returns {string} Complete <prt> XML element
 */
export function generatePRT(part, partIndex) {
    const prtName = `prt${part.id || partIndex + 1}`;

    let prtBody = '';
    switch (part.type) {
        case INPUT_TYPES.NUMERICAL:
            prtBody = generateNumericalPRT(part, prtName);
            break;
        case INPUT_TYPES.UNITS:
            prtBody = generateUnitsPRT(part, prtName);
            break;
        case INPUT_TYPES.ALGEBRAIC:
            prtBody = generateAlgebraicPRT(part, prtName);
            break;
        case INPUT_TYPES.RADIO:
            prtBody = generateRadioPRT(part, prtName);
            break;
        case INPUT_TYPES.MATRIX:
            prtBody = generateMatrixPRT(part, prtName);
            break;
        case INPUT_TYPES.STRING:
            prtBody = generateStringPRT(part, prtName);
            break;
        case INPUT_TYPES.JSXGRAPH:
            prtBody = generateJSXGraphPRT(part, prtName);
            break;
        default:
            // Fallback to algebraic equivalence
            prtBody = generateAlgebraicPRT(part, prtName);
            break;
    }

    return `
    <prt>
      <name>${prtName}</name>
      <value>1.0000000</value>
      <autosimplify>1</autosimplify>
      ${prtBody}
    </prt>`;
}
