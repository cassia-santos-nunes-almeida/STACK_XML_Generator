// Graph preset templates — client-side JS and server-side Maxima grading code
// for common JSXGraph question patterns.
//
// Extracted from ui-manager.js to allow:
// 1. Independent testing of preset code generation
// 2. Reuse by both UI and tests
// 3. Clean separation of graph logic from UI coordination

import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../core/constants.js';
import { cdata, feedbackElement } from './xml-helpers.js';

/**
 * Generates the PRT XML for a JSXGraph interactive answer part.
 *
 * Grading flow:
 *   1. Student interacts with graph -> JS code writes data to hidden input
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
 * Generates default Maxima grading code for common JSXGraph question patterns.
 *
 * IMPORTANT: The student answer written by the client-side JS is a nested list like
 * [[10,20],[30,40]]. Maxima parses this as a MATRIX, not a list of lists.
 * All grading code must convert the student input to a list first using
 * makelist(row, row, studentMatrix) or args() to avoid indexing errors.
 *
 * Each template:
 * - Converts the student matrix to a list of lists for safe indexing
 * - Compares against expected values
 * - Sets 'all_correct' to true/false for the PRT node
 * - Builds 'feedback_msg' with a point-by-point comparison table
 */
export const GRAPH_GRADING_TEMPLATES = {
    pointPlacement: (answerVar, numPoints, tolerance) => `
/* Point Placement Grading — Auto-generated */
/* IMPORTANT: Define 'correct_points' in Question Variables as a list of [x,y] pairs:
   correct_points: [[10,20],[30,40],[50,60]];
   This list must have exactly ${numPoints} points. */

/* Convert student answer from matrix to list of lists for safe indexing.
   Maxima parses [[1,2],[3,4]] as matrix([1,2],[3,4]), not a nested list.
   args() extracts the matrix rows as a plain list. */
student_raw: ${answerVar};
student_pts: if matrixp(student_raw) then args(student_raw) else student_raw;

/* Check that student placed the correct number of points */
student_count: length(student_pts);
correct_count: is(student_count = ${numPoints});

/* Tolerance for point matching */
tolerance: ${tolerance || 5};

/* Use nearest-point matching: for each expected point, find the closest student point.
   This avoids order-dependency — students don't need to place points in a specific order. */
matched_expected: makelist(false, i, 1, ${numPoints});
matched_student: makelist(false, i, 1, student_count);

/* For each expected point, find the closest unmatched student point */
match_results: block([],
    for ei: 1 thru ${numPoints} do (
        block([best_dist, best_si, ex, ey, d],
            ex: correct_points[ei][1],
            ey: correct_points[ei][2],
            best_dist: 99999,
            best_si: 0,
            for si: 1 thru student_count do (
                if not matched_student[si] then (
                    d: sqrt((student_pts[si][1] - ex)^2 + (student_pts[si][2] - ey)^2),
                    if is(d < best_dist) then (best_dist: d, best_si: si)
                )
            ),
            if is(best_si > 0) and is(best_dist < tolerance) then (
                matched_expected[ei]: true,
                matched_student[best_si]: true
            )
        )
    ),
    matched_expected
);

/* Count how many expected points were matched */
pt_checks: makelist(if matched_expected[i] then 1 else 0, i, 1, ${numPoints});
num_correct: apply("+", pt_checks);
all_correct: correct_count and is(num_correct = ${numPoints});

/* Build detailed feedback table showing which points matched */
feedback_parts: makelist(
    sconcat(
        "<tr><td>", i, "</td>",
        "<td>(", string(correct_points[i][1]), ", ", string(correct_points[i][2]), ")</td>",
        "<td>",
        if matched_expected[i] then
            block([si, found],
                found: "?",
                for si: 1 thru student_count do (
                    if matched_student[si] then
                        if is(sqrt((student_pts[si][1] - correct_points[i][1])^2 + (student_pts[si][2] - correct_points[i][2])^2) < tolerance) then
                            found: sconcat("(", string(student_pts[si][1]), ", ", string(student_pts[si][2]), ")")
                ),
                found
            )
        else "no match",
        "</td>",
        "<td>", if is(pt_checks[i] = 1) then "&#10004;" else "&#10008;", "</td></tr>"
    ),
    i, 1, ${numPoints}
);

feedback_msg: sconcat(
    "<strong>", string(num_correct), " / ", string(${numPoints}), " points correct</strong>",
    "<table border='1' cellpadding='4' style='border-collapse:collapse;margin-top:8px'>",
    "<tr><th>#</th><th>Expected</th><th>Your closest</th><th>Result</th></tr>",
    simplode(feedback_parts, ""),
    "</table>"
);
`,

    functionSketch: (answerVar, numPoints, tolerance) => `
/* Function Sketch Grading — Auto-generated */
/* IMPORTANT: Define 'expected_y' in Question Variables as a list of Y-values:
   expected_y: [0, 2, 4, 3, 1];
   These correspond to the Y-value at each student control point. */

/* Convert student answer from matrix to list */
student_raw: ${answerVar};
student_pts: if matrixp(student_raw) then args(student_raw) else student_raw;

tolerance: ${tolerance || 3};

/* Compare student Y-values to expected values */
student_count: length(student_pts);
num_expected: length(expected_y);
pt_checks: makelist(
    if is(i <= student_count) and is(abs(student_pts[i][2] - expected_y[i]) < tolerance) then 1 else 0,
    i, 1, num_expected
);

num_correct: apply("+", pt_checks);
all_correct: is(num_correct >= floor(0.8 * num_expected));

/* Build detailed feedback */
feedback_parts: makelist(
    sconcat(
        "<tr><td>", i, "</td>",
        "<td>", string(expected_y[i]), "</td>",
        "<td>", if is(i <= student_count) then string(student_pts[i][2]) else "missing", "</td>",
        "<td>", if is(pt_checks[i] = 1) then "&#10004;" else "&#10008;", "</td></tr>"
    ),
    i, 1, num_expected
);

feedback_msg: sconcat(
    "<strong>", string(num_correct), "/", string(num_expected), " points matched</strong> (need 80%)",
    "<table border='1' cellpadding='4' style='border-collapse:collapse;margin-top:8px'>",
    "<tr><th>#</th><th>Expected Y</th><th>Your Y</th><th>Result</th></tr>",
    simplode(feedback_parts, ""),
    "</table>"
);
`,

    vectorDraw: (answerVar, numPoints, tolerance) => `
/* Vector Drawing Grading — Auto-generated */
/* IMPORTANT: Define 'expected_vector' in Question Variables as [dx, dy]:
   expected_vector: [3, 4]; */

tolerance: ${tolerance || 2};

/* Student answer is a flat list [startX, startY, endX, endY] */
dx_student: ${answerVar}[3] - ${answerVar}[1];
dy_student: ${answerVar}[4] - ${answerVar}[2];

dx_correct: expected_vector[1];
dy_correct: expected_vector[2];

dx_ok: is(abs(dx_student - dx_correct) < tolerance);
dy_ok: is(abs(dy_student - dy_correct) < tolerance);
all_correct: dx_ok and dy_ok;

/* Build detailed feedback */
feedback_msg: sconcat(
    "<table border='1' cellpadding='4' style='border-collapse:collapse'>",
    "<tr><th></th><th>Your vector</th><th>Expected</th><th>Result</th></tr>",
    "<tr><td>dx</td><td>", string(dx_student), "</td><td>", string(dx_correct), "</td>",
    "<td>", if dx_ok then "&#10004;" else "&#10008;", "</td></tr>",
    "<tr><td>dy</td><td>", string(dy_student), "</td><td>", string(dy_correct), "</td>",
    "<td>", if dy_ok then "&#10004;" else "&#10008;", "</td></tr>",
    "</table>"
);
`,
};

/**
 * Generates preset graph JavaScript code for common graph types.
 * This is the client-side JS that runs in the student's browser.
 *
 * IMPORTANT: The answer must be written as a Maxima-parseable string.
 * For point-based presets, we write nested lists like [[10,20],[30,40]].
 * Maxima parses these as matrices, so grading code must use args() to convert.
 *
 * @param {string} presetKey - Preset identifier
 * @param {string} ansVar - Answer variable name (e.g., 'ans1')
 * @param {number} numPoints - Maximum number of points
 * @returns {string} JavaScript code for the JSXGraph block
 */
export function generatePresetGraphCode(presetKey, ansVar, numPoints) {
    const refVar = `${ansVar}Ref`;
    const maxPts = numPoints || 5;

    switch (presetKey) {
        case 'pointPlacement':
            return `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-5, 70, 65, -70],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

board.create('text', [62, -5, 't'], {fontSize: 14});
board.create('text', [-3, 65, 'f(t)'], {fontSize: 14});

var studentPoints = [];
var segments = [];

board.on('down', function(e) {
    if (e.target !== board.containerObj) return;
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    if (studentPoints.length < ${maxPts}) {
        var p = board.create('point', [x, y], {
            name: '(' + x + ',' + y + ')',
            size: 4, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb',
            snapToGrid: true
        });
        p.on('drag', function() { updateAnswer(); });
        studentPoints.push(p);

        if (studentPoints.length > 1) {
            segments.push(board.create('segment',
                [studentPoints[studentPoints.length-2], studentPoints[studentPoints.length-1]],
                {strokeColor: '#ef4444', strokeWidth: 2}
            ));
        }
        updateAnswer();
    }
});

function updateAnswer() {
    var parts = [];
    for (var i = 0; i < studentPoints.length; i++) {
        var px = Math.round(studentPoints[i].X());
        var py = Math.round(studentPoints[i].Y());
        parts.push('[' + px + ',' + py + ']');
    }
    var el = document.getElementById(${refVar});
    if (el) {
        el.value = studentPoints.length > 0 ? '[' + parts.join(',') + ']' : '[]';
    }
}

board.create('button', [5, 60, 'Reset', function() {
    JXG.JSXGraph.freeBoard(board);
    board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-5, 70, 65, -70],
        axis: true, showNavigation: true, showCopyright: false, grid: true
    });
    studentPoints = [];
    segments = [];
    var el = document.getElementById(${refVar});
    if (el) el.value = '[]';
}]);`;

        case 'functionSketch':
            return `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-2, 12, 12, -2],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

var points = [];
var curve = null;

board.on('down', function(e) {
    if (e.target !== board.containerObj) return;
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0] * 2) / 2;
    var y = Math.round(coords[1] * 2) / 2;

    var p = board.create('point', [x, y], {
        size: 3, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb'
    });
    p.on('drag', function() {
        updateAnswer();
        if (points.length > 1) {
            if (curve) board.removeObject(curve);
            curve = board.create('spline', points, {strokeColor: '#ef4444', strokeWidth: 2});
        }
    });
    points.push(p);

    if (points.length > 1 && curve) board.removeObject(curve);
    if (points.length > 1) {
        curve = board.create('spline', points, {strokeColor: '#ef4444', strokeWidth: 2});
    }
    updateAnswer();
});

function updateAnswer() {
    var parts = [];
    for (var i = 0; i < points.length; i++) {
        var px = (Math.round(points[i].X() * 2) / 2).toFixed(1);
        var py = (Math.round(points[i].Y() * 2) / 2).toFixed(1);
        parts.push('[' + px + ',' + py + ']');
    }
    var el = document.getElementById(${refVar});
    if (el) el.value = points.length > 0 ? '[' + parts.join(',') + ']' : '[]';
}`;

        case 'vectorDraw':
            return `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-10, 10, 10, -10],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

var startPt = board.create('point', [0, 0], {
    name: 'Start', size: 4, strokeColor: '#2563eb', fillColor: '#2563eb'
});
var endPt = board.create('point', [3, 4], {
    name: 'End', size: 4, strokeColor: '#ef4444', fillColor: '#ef4444'
});

board.create('arrow', [startPt, endPt], {strokeWidth: 3, strokeColor: '#10b981'});

function updateAnswer() {
    var el = document.getElementById(${refVar});
    if (el) el.value = '[' + startPt.X().toFixed(1) + ',' + startPt.Y().toFixed(1) + ',' +
                              endPt.X().toFixed(1) + ',' + endPt.Y().toFixed(1) + ']';
}

startPt.on('drag', updateAnswer);
endPt.on('drag', updateAnswer);
updateAnswer();`;

        default:
            return '// Custom graph code here';
    }
}
