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

function getMouseCoords(e) {
    var cPos = board.getCoordsTopLeftCorner(e),
        absPos = JXG.getPosition(e),
        dx = absPos[0] - cPos[0],
        dy = absPos[1] - cPos[1];
    return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], board);
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
});

function updateAnswer() {
    var arr = [];
    for (var i = 0; i < studentPoints.length; i++) {
        arr.push('[' + Math.round(studentPoints[i].X()) + ',' + Math.round(studentPoints[i].Y()) + ']');
    }
    var el = document.getElementById(ans1Ref);
    if(el) el.value = studentPoints.length > 0 ? '[' + arr.join(',') + ']' : '[]';
}

board.create('button', [5, 60, 'Reset', function() {
    JXG.JSXGraph.freeBoard(board);
    board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-5, 70, 65, -70],
        axis: true, showNavigation: true, showCopyright: false, grid: true
    });
    studentPoints = [];
    segments = [];
    var el = document.getElementById(ans1Ref);
    if(el) el.value = '[]';
}]);`,
                gradingCode: `/* Check number of points */
correct_count: is(length(ans1) = 5);

/* Check each point within tolerance */
tolerance: 5;
pt_checks: makelist(
    if is(abs(ans1[i][1] - correct_points[i][1]) < tolerance) and
       is(abs(ans1[i][2] - correct_points[i][2]) < tolerance) then 1 else 0,
    i, 1, 5
);

/* All must be correct */
num_correct: apply("+", pt_checks);
all_correct: correct_count and is(num_correct = 5);`,
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
