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
};
