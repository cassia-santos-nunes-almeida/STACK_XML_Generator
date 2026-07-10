// PRT generator for string (text) answer type
// Uses String answer test for literal text matching
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { feedbackElement } from '../xml-helpers.js';
import { requireTeacherAnswer } from '../teacher-answer.js';

/**
 * Generates the PRT XML for a string answer part.
 *
 * Uses the String answer test (case-sensitive) or StringSloppy (case-insensitive).
 * String test compares literal text without algebraic interpretation.
 *
 * @param {object} part - Part data
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateStringPRT(part, prtName) {
    const fb = part.feedback || {};
    const caseSensitive = part.grading?.caseSensitive !== false; // default true
    const teacherAnswer = requireTeacherAnswer(part);

    return `
      <node>
        <name>0</name>
        <answertest>${caseSensitive ? ANSWER_TESTS.STRING : ANSWER_TESTS.STRING_SLOPPY}</answertest>
        <sans>${part.answer}</sans>
        <tans>${teacherAnswer}</tans>
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
