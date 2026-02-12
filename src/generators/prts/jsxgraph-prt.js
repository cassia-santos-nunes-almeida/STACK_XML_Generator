// PRT generator for JSXGraph interactive graph answer type
// Uses custom Maxima code in feedbackvariables + AlgEquiv for boolean result
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { cdata, feedbackElement } from '../xml-helpers.js';

/**
 * Generates the PRT XML for a JSXGraph interactive answer part.
 *
 * Grading flow:
 *   1. Student interacts with graph → JS code writes data to hidden input
 *   2. feedbackvariables: Custom Maxima code processes student data
 *   3. Final variable 'all_correct' (true/false) determines pass/fail
 *   4. Single AlgEquiv node checks all_correct against true
 *
 * @param {object} part - Part data with .gradingCode
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateJSXGraphPRT(part, prtName) {
    const fb = part.feedback || {};
    const gradingCode = part.gradingCode || 'all_correct: true;';

    return `
      <feedbackvariables>
        <text>${cdata(gradingCode)}</text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <answertest>${ANSWER_TESTS.ALG_EQUIV}</answertest>
        <sans>all_correct</sans>
        <tans>true</tans>
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
        ${feedbackElement('falsefeedback', fb.incorrect || 'Incorrect. Please check your graph.')}
      </node>`;
}

/**
 * Generates default grading code for common JSXGraph question patterns.
 * Teachers can use these as starting points instead of writing from scratch.
 */
export const GRAPH_GRADING_TEMPLATES = {
    pointPlacement: (answerVar, numPoints, tolerance) => `
/* Point Placement Grading — Auto-generated */
/* Check that student placed the correct number of points */
correct_count: is(length(${answerVar}) = ${numPoints});

/* Check each point is within tolerance of the expected position */
tolerance: ${tolerance || 5};
pt_checks: makelist(
    is(abs(${answerVar}[i][1] - correct_points[i][1]) < tolerance) and
    is(abs(${answerVar}[i][2] - correct_points[i][2]) < tolerance),
    i, 1, ${numPoints}
);

/* All points must be correct */
all_correct: correct_count and is(apply("and", pt_checks));
`,

    functionSketch: (answerVar, tolerance) => `
/* Function Sketch Grading — Auto-generated */
/* Student draws a function; check key points match expected curve */
tolerance: ${tolerance || 3};

/* Compare student points to expected function values */
pt_checks: makelist(
    is(abs(${answerVar}[i][2] - expected_y[i]) < tolerance),
    i, 1, length(${answerVar})
);

num_correct: apply("+", makelist(if pt_checks[i] then 1 else 0, i, 1, length(pt_checks)));
all_correct: is(num_correct >= floor(0.8 * length(pt_checks)));
`,

    vectorDraw: (answerVar, tolerance) => `
/* Vector Drawing Grading — Auto-generated */
tolerance: ${tolerance || 2};

/* Check vector components (stored as [startX, startY, endX, endY]) */
dx_student: ${answerVar}[3] - ${answerVar}[1];
dy_student: ${answerVar}[4] - ${answerVar}[2];

dx_correct: expected_vector[1];
dy_correct: expected_vector[2];

all_correct: is(abs(dx_student - dx_correct) < tolerance) and
             is(abs(dy_student - dy_correct) < tolerance);
`,
};
