// PRT generator for radio (multiple choice) answer type
// Uses AlgEquiv to compare student selection with correct answer string
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { escapeXml, feedbackElement } from '../xml-helpers.js';

/**
 * Generates the PRT XML for a radio (MCQ) answer part.
 *
 * In STACK, radio inputs submit the selected option's value as a string.
 * The PRT compares this with the correct option value.
 *
 * @param {object} part - Part data with .options array
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateRadioPRT(part, prtName) {
    const fb = part.feedback || {};
    const correctOpt = part.options.find(o => o.correct);
    const correctVal = correctOpt ? correctOpt.value : '';

    // For STACK radio, the teacher answer in PRT should be the correct option's index + 1
    // STACK radio inputs return the 1-based index of the selected option
    const correctIndex = part.options.findIndex(o => o.correct) + 1;

    return `
      <node>
        <name>0</name>
        <answertest>${ANSWER_TESTS.ALG_EQUIV}</answertest>
        <sans>${part.answer}</sans>
        <tans>${correctIndex}</tans>
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

/**
 * Generates the teacher answer variable for radio input.
 * STACK radio inputs need the correct answer defined as a variable.
 */
export function generateRadioTeacherAnswer(part) {
    const correctIndex = part.options.findIndex(o => o.correct) + 1;
    return String(correctIndex);
}
