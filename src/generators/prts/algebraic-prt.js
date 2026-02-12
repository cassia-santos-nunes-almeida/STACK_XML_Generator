// PRT generator for algebraic answer type
// Uses AlgEquiv for symbolic equivalence checking
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { feedbackElement } from '../xml-helpers.js';

/**
 * Generates the PRT XML for an algebraic (symbolic) answer part.
 *
 * Uses AlgEquiv which checks algebraic equivalence:
 * e.g., x^2 + 2x + 1 === (x+1)^2
 *
 * @param {object} part - Part data
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateAlgebraicPRT(part, prtName) {
    const fb = part.feedback || {};

    return `
      <node>
        <name>0</name>
        <answertest>${ANSWER_TESTS.ALG_EQUIV}</answertest>
        <sans>${part.answer}</sans>
        <tans>${part.answer}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${SCORE_MODES.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-0-T</trueanswernote>
        ${feedbackElement('truefeedback', fb.correct || DEFAULT_FEEDBACK.correct)}
        <falsescoremode>${SCORE_MODES.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
        ${feedbackElement('falsefeedback', fb.incorrect || DEFAULT_FEEDBACK.incorrect)}
      </node>`;
}
