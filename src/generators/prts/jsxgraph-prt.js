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
 *   5. 'feedback_msg' variable (if defined) provides detailed comparison
 *
 * @param {object} part - Part data with .gradingCode
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateJSXGraphPRT(part, prtName) {
    const fb = part.feedback || {};
    // Default: fail safe — if no grading code, answer is marked wrong
    const gradingCode = part.gradingCode || 'all_correct: is(1 = 0);';

    // Build feedback messages that include the detailed comparison if available
    const trueFb = fb.correct || DEFAULT_FEEDBACK.correct;
    const falseFb = fb.incorrect || 'Incorrect. Please check your graph.';

    // Append feedback_msg variable output if the grading code defines it
    const trueFeedbackHtml = `${trueFb}<br><hr><p>{@feedback_msg@}</p>`;
    const falseFeedbackHtml = `${falseFb}<br><hr><p>{@feedback_msg@}</p>`;

    return `
      <feedbackvariables>
        <text>${cdata(gradingCode + '\n/* Ensure feedback_msg exists */\nif not boundp(feedback_msg) then feedback_msg: "";')}</text>
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
        ${feedbackElement('truefeedback', trueFeedbackHtml)}
        <falsescoremode>${SCORE_MODES.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
        ${feedbackElement('falsefeedback', falseFeedbackHtml)}
      </node>`;
}

/**
 * Generates default grading code for common JSXGraph question patterns.
 * Teachers can use these as starting points instead of writing from scratch.
 *
 * Each template generates Maxima code that:
 * - Compares the student's answer against expected values
 * - Sets 'all_correct' to true/false for the PRT node
 * - Builds 'feedback_msg' with a point-by-point comparison for detailed feedback
 */
export const GRAPH_GRADING_TEMPLATES = {
    pointPlacement: (answerVar, numPoints, tolerance) => `
/* Point Placement Grading — Auto-generated */
/* IMPORTANT: You must define 'correct_points' in your Question Variables, e.g.:
   correct_points: [[10,20],[30,40],[50,60]];
   This list must have exactly ${numPoints} points: [[x1,y1],[x2,y2],...] */

/* Check that student placed the correct number of points */
student_count: length(${answerVar});
correct_count: is(student_count = ${numPoints});

/* Check each point is within tolerance of the expected position */
tolerance: ${tolerance || 5};

/* Compare each student point to the corresponding expected point */
pt_checks: if correct_count then makelist(
    if is(abs(${answerVar}[i][1] - correct_points[i][1]) < tolerance) and
       is(abs(${answerVar}[i][2] - correct_points[i][2]) < tolerance) then 1 else 0,
    i, 1, ${numPoints}
) else makelist(0, i, 1, ${numPoints});

/* Count how many points are correct */
num_correct: apply("+", pt_checks);
all_correct: correct_count and is(num_correct = ${numPoints});

/* Build detailed feedback showing which points matched */
feedback_parts: makelist(
    sconcat("Point ", i, ": your (",
        if correct_count and is(i <= student_count) then string(${answerVar}[i][1]) else "?", ",",
        if correct_count and is(i <= student_count) then string(${answerVar}[i][2]) else "?",
        ") vs expected (",
        string(correct_points[i][1]), ",", string(correct_points[i][2]), ") &mdash; ",
        if is(pt_checks[i] = 1) then "correct" else "incorrect"
    ),
    i, 1, ${numPoints}
);
feedback_msg: simplode(feedback_parts, "<br>");
`,

    functionSketch: (answerVar, numPoints, tolerance) => `
/* Function Sketch Grading — Auto-generated */
/* IMPORTANT: You must define 'expected_y' in your Question Variables, e.g.:
   expected_y: [0, 2, 4, 3, 1];
   This list of Y-values corresponds to the Y-values at each student control point. */

tolerance: ${tolerance || 3};

/* Compare student points to expected function values */
student_count: length(${answerVar});
num_expected: length(expected_y);
pt_checks: makelist(
    if is(i <= student_count) and is(abs(${answerVar}[i][2] - expected_y[i]) < tolerance) then 1 else 0,
    i, 1, num_expected
);

num_correct: apply("+", pt_checks);
all_correct: is(num_correct >= floor(0.8 * num_expected));

/* Build detailed feedback */
feedback_parts: makelist(
    sconcat("Control point ", i, ": your Y=",
        if is(i <= student_count) then string(${answerVar}[i][2]) else "missing",
        " vs expected Y=", string(expected_y[i]),
        " &mdash; ", if is(pt_checks[i] = 1) then "correct" else "incorrect"
    ),
    i, 1, num_expected
);
feedback_msg: sconcat(string(num_correct), "/", string(num_expected), " points matched (need 80%).<br>", simplode(feedback_parts, "<br>"));
`,

    vectorDraw: (answerVar, numPoints, tolerance) => `
/* Vector Drawing Grading — Auto-generated */
/* IMPORTANT: You must define 'expected_vector' in your Question Variables, e.g.:
   expected_vector: [3, 4];
   This is [dx, dy] — the expected vector components. */

tolerance: ${tolerance || 2};

/* Check vector components (stored as [startX, startY, endX, endY]) */
dx_student: ${answerVar}[3] - ${answerVar}[1];
dy_student: ${answerVar}[4] - ${answerVar}[2];

dx_correct: expected_vector[1];
dy_correct: expected_vector[2];

dx_ok: is(abs(dx_student - dx_correct) < tolerance);
dy_ok: is(abs(dy_student - dy_correct) < tolerance);
all_correct: dx_ok and dy_ok;

/* Build detailed feedback */
feedback_msg: sconcat(
    "Your vector: (", string(dx_student), ", ", string(dy_student), ")<br>",
    "Expected vector: (", string(dx_correct), ", ", string(dy_correct), ")<br>",
    "dx: ", if dx_ok then "correct" else "incorrect",
    " | dy: ", if dy_ok then "correct" else "incorrect"
);
`,
};
