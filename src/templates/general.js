// General and interactive question templates

export const GENERAL_TEMPLATES = {
    blank: {
        name: '-- Blank Question --',
        questionText: '',
        variables: [],
        parts: [],
        generalFeedback: '',
        hints: [],
        images: [],
    },

    mcq_primes: {
        name: 'General: Multiple Choice',
        questionText: 'Which of the following integers is a prime number?',
        variables: [],
        parts: [
            {
                id: 1,
                type: 'radio',
                text: 'Choose one:',
                answer: 'ans1',
                options: [
                    { value: '4', correct: false },
                    { value: '7', correct: true },
                    { value: '9', correct: false },
                    { value: '15', correct: false },
                ],
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct! 7 is prime — it has no divisors other than 1 and itself.',
                    incorrect: 'Incorrect. A prime number has exactly two factors: 1 and itself.',
                },
            },
        ],
        generalFeedback: 'A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.<br>4 = 2x2, 9 = 3x3, 15 = 3x5 — none are prime.<br>7 has no divisors other than 1 and 7, so it is prime.',
        hints: ['A prime number can only be divided by 1 and itself.'],
        images: [],
    },

    jsxgraph_connect: {
        name: 'Interactive: Point Placement Graph',
        questionText: 'Sketch the function \\(f(t)\\) by clicking on the graph to place points at the key locations.<br><small>Click to place 5 points. They will connect automatically.</small>',
        variables: [
            { name: 't1', type: 'rand', value: '10' },
            { name: 't2', type: 'rand', value: '30' },
            { name: 't3', type: 'rand', value: '40' },
            { name: 't4', type: 'rand', value: '60' },
            { name: 'p0', type: 'algebraic', value: '[0, 0]' },
            { name: 'p1', type: 'algebraic', value: '[t1, 5*t1]' },
            { name: 'p2', type: 'algebraic', value: '[t2, -5*t2 + 100]' },
            { name: 'p3', type: 'algebraic', value: '[t3, -50]' },
            { name: 'p4', type: 'algebraic', value: '[t4, 0]' },
            { name: 'correct_points', type: 'algebraic', value: '[p0, p1, p2, p3, p4]' },
            { name: 'ans1', type: 'algebraic', value: 'correct_points' },
        ],
        parts: [
            {
                id: 1,
                type: 'jsxgraph',
                text: 'Place 5 points on the graph:',
                answer: 'ans1',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [],
                graphCode: `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-5, 70, 65, -70],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

board.create('text', [62, -5, 't (s)'], {fontSize: 14});
board.create('text', [-3, 65, 'f(t)'], {fontSize: 14});

var studentPoints = [];
var segments = [];
var stateInput = document.getElementById(ans1Ref);

function serializePoints() {
    if (studentPoints.length === 0) {
        stateInput.value = '[]';
    } else {
        var parts = [];
        for (var i = 0; i < studentPoints.length; i++) {
            parts.push('[' + Math.round(studentPoints[i].X()) + ',' + Math.round(studentPoints[i].Y()) + ']');
        }
        stateInput.value = '[' + parts.join(',') + ']';
    }
    stateInput.dispatchEvent(new Event('change'));
}

function getMouseCoords(e) {
    var cPos = board.getCoordsTopLeftCorner(e),
        absPos = JXG.getPosition(e),
        dx = absPos[0] - cPos[0],
        dy = absPos[1] - cPos[1];
    return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], board);
}

function addPoint(x, y) {
    var p = board.create('point', [x, y], {
        name: '(' + Math.round(x) + ',' + Math.round(y) + ')',
        size: 4, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb',
        snapToGrid: true
    });
    p.on('drag', function() {
        p.setName('(' + Math.round(p.X()) + ',' + Math.round(p.Y()) + ')');
        board.update();
        serializePoints();
    });
    studentPoints.push(p);
    if (studentPoints.length > 1) {
        segments.push(board.create('segment',
            [studentPoints[studentPoints.length-2], studentPoints[studentPoints.length-1]],
            {strokeColor: '#ef4444', strokeWidth: 2}
        ));
    }
    return p;
}

/* Restore state from saved answer on page reload */
if (stateInput.value && stateInput.value !== '' && stateInput.value !== '[]') {
    var matches = stateInput.value.match(/\\[(-?[\\d.]+),\\s*(-?[\\d.]+)\\]/g);
    if (matches) {
        for (var i = 0; i < matches.length && i < 5; i++) {
            var nums = matches[i].match(/(-?[\\d.]+)/g);
            if (nums && nums.length >= 2) addPoint(parseFloat(nums[0]), parseFloat(nums[1]));
        }
        board.update();
    }
}

board.on('down', function(e) {
    var canCreate = true, coords, el, x, y;

    if (e[JXG.touchProperty]) return;

    coords = getMouseCoords(e);

    for (el in board.objects) {
        if (JXG.isPoint(board.objects[el]) && board.objects[el].hasPoint(coords.scrCoords[1], coords.scrCoords[2])) {
            canCreate = false;
            break;
        }
    }

    if (!canCreate || studentPoints.length >= 5) return;

    x = Math.round(coords.usrCoords[1]);
    y = Math.round(coords.usrCoords[2]);
    addPoint(x, y);
    serializePoints();
});

board.create('button', [5, 60, 'Reset', function() {
    for (var i = segments.length - 1; i >= 0; i--) board.removeObject(segments[i]);
    for (var i = studentPoints.length - 1; i >= 0; i--) board.removeObject(studentPoints[i]);
    studentPoints = [];
    segments = [];
    board.update();
    serializePoints();
}]);`,
                gradingCode: `/* Convert student answer from matrix to list (Maxima parses [[a,b]] as matrix) */
student_raw: ans1;
student_pts: if matrixp(student_raw) then args(student_raw) else student_raw;

/* Check number of points */
student_count: length(student_pts);
correct_count: is(student_count = 5);

/* Tolerance for point matching */
tolerance: 5;

/* Nearest-point matching (order-independent) */
matched_expected: makelist(false, i, 1, 5);
matched_student: makelist(false, i, 1, student_count);
match_pair: makelist(0, i, 1, 5);

match_results: block([],
    for ei: 1 thru 5 do (
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
                matched_student[best_si]: true,
                match_pair[ei]: best_si
            )
        )
    ),
    matched_expected
);

pt_checks: makelist(if matched_expected[i] then 1 else 0, i, 1, 5);
num_correct: apply("+", pt_checks);
all_correct: correct_count and is(num_correct = 5);

/* Build detailed feedback table showing which points matched */
feedback_parts: makelist(
    sconcat(
        "<tr><td>", i, "</td>",
        "<td>(", string(correct_points[i][1]), ", ", string(correct_points[i][2]), ")</td>",
        "<td>",
        if is(match_pair[i] > 0) then
            sconcat("(", string(student_pts[match_pair[i]][1]), ", ", string(student_pts[match_pair[i]][2]), ")")
        else "no match",
        "</td>",
        "<td>", if is(pt_checks[i] = 1) then "&#10004;" else "&#10008;", "</td></tr>"
    ),
    i, 1, 5
);

feedback_msg: sconcat(
    "<strong>", string(num_correct), " / 5 points correct</strong>",
    "<table border='1' cellpadding='4' style='border-collapse:collapse;margin-top:8px'>",
    "<tr><th>#</th><th>Expected</th><th>Your closest</th><th>Result</th></tr>",
    simplode(feedback_parts, ""),
    "</table>"
);`,
                feedback: {
                    correct: 'Correct! All points are in the right positions.',
                    incorrect: 'Some points are not in the correct positions. Check each key point of the function.',
                },
            },
        ],
        generalFeedback: 'The function has key points at t=0, t={@t1@}, t={@t2@}, t={@t3@}, and t={@t4@}.',
        hints: ['Start from the origin (0,0) and work through each time interval.'],
        images: [],
    },

    jsxgraph_sketch: {
        name: 'Interactive: Function Sketch',
        questionText: 'Sketch the graph of the function \\(y = f(x)\\) described below by clicking on the graph to place control points. A smooth curve will be drawn through your points.<br><br>The function has the following values:<br>\\(f({@x1@}) = {@y1@}\\), \\(f({@x2@}) = {@y2@}\\), \\(f({@x3@}) = {@y3@}\\), \\(f({@x4@}) = {@y4@}\\), \\(f({@x5@}) = {@y5@}\\).<br><small>Click to place 5 control points, then a spline will connect them.</small>',
        variables: [
            { name: 'x1', type: 'algebraic', value: '0' },
            { name: 'x2', type: 'algebraic', value: '2' },
            { name: 'x3', type: 'algebraic', value: '4' },
            { name: 'x4', type: 'algebraic', value: '6' },
            { name: 'x5', type: 'algebraic', value: '8' },
            { name: 'y1', type: 'rand', value: 'rand(3)' },
            { name: 'y2', type: 'rand', value: 'rand(5)+3' },
            { name: 'y3', type: 'rand', value: 'rand(5)+5' },
            { name: 'y4', type: 'rand', value: 'rand(5)+2' },
            { name: 'y5', type: 'rand', value: 'rand(3)' },
            { name: 'expected_y', type: 'algebraic', value: '[y1, y2, y3, y4, y5]' },
            { name: 'ans1', type: 'algebraic', value: 'expected_y' },
        ],
        parts: [
            {
                id: 1,
                type: 'jsxgraph',
                text: 'Place 5 control points on the graph at the x-values given above:',
                answer: 'ans1',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [],
                graphPreset: 'functionSketch',
                graphMaxPoints: 5,
                graphTolerance: 3,
                graphCode: `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-2, 12, 12, -2],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

var points = [];
var curve = null;
var stateInput = document.getElementById(ans1Ref);

function serializePoints() {
    if (points.length === 0) {
        stateInput.value = '[]';
    } else {
        var parts = [];
        for (var i = 0; i < points.length; i++) {
            var px = (Math.round(points[i].X() * 2) / 2).toFixed(1);
            var py = (Math.round(points[i].Y() * 2) / 2).toFixed(1);
            parts.push('[' + px + ',' + py + ']');
        }
        stateInput.value = '[' + parts.join(',') + ']';
    }
    stateInput.dispatchEvent(new Event('change'));
}

function getMouseCoords(e) {
    var cPos = board.getCoordsTopLeftCorner(e),
        absPos = JXG.getPosition(e),
        dx = absPos[0] - cPos[0],
        dy = absPos[1] - cPos[1];
    return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], board);
}

function redrawCurve() {
    if (curve) board.removeObject(curve);
    if (points.length > 1) {
        curve = board.create('spline', points, {strokeColor: '#ef4444', strokeWidth: 2});
    }
}

function addSketchPoint(x, y) {
    var p = board.create('point', [x, y], {
        size: 3, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb'
    });
    p.on('drag', function() {
        redrawCurve();
        serializePoints();
    });
    points.push(p);
    redrawCurve();
    return p;
}

/* Restore state from saved answer on page reload */
if (stateInput.value && stateInput.value !== '' && stateInput.value !== '[]') {
    var matches = stateInput.value.match(/\\[(-?[\\d.]+),\\s*(-?[\\d.]+)\\]/g);
    if (matches) {
        for (var i = 0; i < matches.length; i++) {
            var nums = matches[i].match(/(-?[\\d.]+)/g);
            if (nums && nums.length >= 2) addSketchPoint(parseFloat(nums[0]), parseFloat(nums[1]));
        }
        board.update();
    }
}

board.on('down', function(e) {
    var canCreate = true, coords, el;

    if (e[JXG.touchProperty]) return;

    coords = getMouseCoords(e);

    for (el in board.objects) {
        if (JXG.isPoint(board.objects[el]) && board.objects[el].hasPoint(coords.scrCoords[1], coords.scrCoords[2])) {
            canCreate = false;
            break;
        }
    }

    if (!canCreate) return;

    var x = Math.round(coords.usrCoords[1] * 2) / 2;
    var y = Math.round(coords.usrCoords[2] * 2) / 2;
    addSketchPoint(x, y);
    serializePoints();
});`,
                gradingCode: `/* Function Sketch Grading — Auto-generated */
/* IMPORTANT: Define 'expected_y' in Question Variables as a list of Y-values:
   expected_y: [0, 2, 4, 3, 1];
   These correspond to the Y-value at each student control point. */

/* Convert student answer from matrix to list */
student_raw: ans1;
student_pts: if matrixp(student_raw) then args(student_raw) else student_raw;

tolerance: 3;

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
);`,
                feedback: {
                    correct: 'Correct! Your sketch matches the expected function shape.',
                    incorrect: 'Some of your control points do not match the expected Y-values. Check the function values given in the question.',
                },
            },
        ],
        generalFeedback: 'The function passes through the points:<br>\\(({@x1@}, {@y1@})\\), \\(({@x2@}, {@y2@})\\), \\(({@x3@}, {@y3@})\\), \\(({@x4@}, {@y4@})\\), \\(({@x5@}, {@y5@})\\).<br>Place your control points at these coordinates and the spline will approximate the correct curve.',
        hints: ['Start from the leftmost point and work to the right.', 'Check the Y-value at each given X-coordinate carefully.'],
        images: [],
    },

    show_reasoning: {
        name: 'General: Show Reasoning (Partial Auto-Correction)',
        questionText: 'A factory produces {@n@} items per hour. Due to a defect rate of {@d@}%, some items must be discarded.<br><br>Answer the following questions and <strong>explain your reasoning</strong> for each step.',
        variables: [
            { name: 'n', type: 'rand', value: 'rand(50)+50' },
            { name: 'd', type: 'rand', value: 'rand(8)+2' },
            { name: 'defective', type: 'calc', value: 'n * d / 100' },
            { name: 'ans1', type: 'algebraic', value: 'n * d / 100' },
            { name: 'good', type: 'calc', value: 'n - defective' },
            { name: 'ans2', type: 'algebraic', value: 'n - n * d / 100' },
            { name: 'hours', type: 'rand', value: 'rand(6)+2' },
            { name: 'ans3', type: 'algebraic', value: '(n - n * d / 100) * hours' },
            { name: 'total_good', type: 'calc', value: 'good * hours' },
        ],
        parts: [
            {
                id: 1,
                type: 'numerical',
                text: 'How many defective items are produced per hour?',
                answer: 'ans1',
                grading: { tightTol: 0.01, wideTol: 0.5, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct!',
                    incorrect: 'Multiply the total items by the defect rate (as a decimal).',
                },
            },
            {
                id: 2,
                type: 'notes',
                text: 'Explain how you calculated the number of defective items. What formula did you use and why?',
                answer: 'notes2',
                notesAutoCredit: true,
                notesRequireImage: false,
                notesBoxSize: 4,
                notesSyntaxHint: 'e.g., I multiplied the production rate by the defect percentage...',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {},
            },
            {
                id: 3,
                type: 'numerical',
                text: 'How many good (non-defective) items are produced per hour?',
                answer: 'ans2',
                prerequisite: 1,
                grading: { tightTol: 0.01, wideTol: 0.5, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct!',
                    incorrect: 'Subtract the defective items from the total production.',
                },
            },
            {
                id: 4,
                type: 'numerical',
                text: 'If the factory runs for {@hours@} hours, how many good items are produced in total?',
                answer: 'ans3',
                prerequisite: 3,
                grading: { tightTol: 0.1, wideTol: 1.0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct!',
                    incorrect: 'Multiply the hourly good items by the number of hours.',
                },
            },
            {
                id: 5,
                type: 'notes',
                text: 'Summarise your complete approach. Explain each step of your calculation and how the parts connect together.',
                answer: 'notes5',
                notesAutoCredit: true,
                notesRequireImage: true,
                notesBoxSize: 6,
                notesSyntaxHint: 'Step 1: I found the defective items by... Step 2: I subtracted to get... Step 3: I multiplied by hours to get...',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {},
            },
        ],
        generalFeedback: '<strong>Worked Solution:</strong><br>1. Defective items per hour: \\({@n@} \\times \\frac{{@d@}}{100} = {@defective@}\\)<br>2. Good items per hour: \\({@n@} - {@defective@} = {@good@}\\)<br>3. Total good items in {@hours@} hours: \\({@good@} \\times {@hours@} = {@total_good@}\\)<br><br>The key idea is to break the problem into steps: first find the defect count, then subtract to get good items, then scale by time.',
        hints: [
            'The defect rate is a percentage — convert it to a decimal by dividing by 100.',
            'Good items = Total items - Defective items.',
            'For multiple hours, multiply the hourly rate by the number of hours.',
        ],
        images: [],
    },

    jsxgraph_vector: {
        name: 'Interactive: Vector Drawing',
        questionText: 'Draw the vector \\(\\vec{v} = ({@vx@}, {@vy@})\\) on the coordinate plane below.<br>Drag the start point (blue) and end point (red) so that the vector has the correct components.<br><small>The vector components are: \\(\\Delta x = {@vx@}\\), \\(\\Delta y = {@vy@}\\).</small>',
        variables: [
            { name: 'vx', type: 'rand', value: 'rand(7)-3' },
            { name: 'vy', type: 'rand', value: 'rand(7)-3' },
            { name: 'expected_vector', type: 'algebraic', value: '[vx, vy]' },
            { name: 'ans1', type: 'algebraic', value: '[0, 0, vx, vy]' },
        ],
        parts: [
            {
                id: 1,
                type: 'jsxgraph',
                text: 'Drag the points to draw the vector with the correct components:',
                answer: 'ans1',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [],
                graphPreset: 'vectorDraw',
                graphMaxPoints: 4,
                graphTolerance: 2,
                graphCode: `var board = JXG.JSXGraph.initBoard(divid, {
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

/* Use STACK binding API — serialize as flat list [startX, startY, endX, endY] */
stack_jxg.custom_bind(ans1Ref, function() {
    return '[' + startPt.X().toFixed(1) + ',' + startPt.Y().toFixed(1) + ',' +
                 endPt.X().toFixed(1) + ',' + endPt.Y().toFixed(1) + ']';
}, function(data) {
    if (!data || data === '' || data === '[]') return;
    var nums = data.match(/(-?[\\d.]+)/g);
    if (nums && nums.length >= 4) {
        startPt.moveTo([parseFloat(nums[0]), parseFloat(nums[1])]);
        endPt.moveTo([parseFloat(nums[2]), parseFloat(nums[3])]);
    }
    board.update();
}, [startPt, endPt]);`,
                gradingCode: `/* Vector Drawing Grading — Auto-generated */
/* IMPORTANT: Define 'expected_vector' in Question Variables as [dx, dy]:
   expected_vector: [3, 4]; */

tolerance: 2;

/* Student answer is a flat list [startX, startY, endX, endY] */
dx_student: ans1[3] - ans1[1];
dy_student: ans1[4] - ans1[2];

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
);`,
                feedback: {
                    correct: 'Correct! Your vector has the right components.',
                    incorrect: 'The vector components do not match. Remember: \\(\\Delta x = \\text{end}_x - \\text{start}_x\\) and \\(\\Delta y = \\text{end}_y - \\text{start}_y\\).',
                },
            },
        ],
        generalFeedback: 'The vector \\(\\vec{v} = ({@vx@}, {@vy@})\\) means:<br>\\(\\Delta x = {@vx@}\\) (horizontal component)<br>\\(\\Delta y = {@vy@}\\) (vertical component).<br>For example, starting at the origin \\((0,0)\\), the end point should be at \\(({@vx@}, {@vy@})\\).',
        hints: ['The vector components are the differences: dx = end_x - start_x, dy = end_y - start_y.', 'You can place the start point anywhere — only the direction and magnitude matter.'],
        images: [],
    },
};
