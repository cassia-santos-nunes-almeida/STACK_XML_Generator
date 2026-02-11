
export const TEMPLATES = {
    blank: {
        name: "-- Blank Question --",
        questionText: "Write your question here...",
        variables: [],
        parts: []
    },
    inductor: {
        name: "Engineering: Inductor Energy (Numerical)",
        questionText: "An inductor with inductance $L = {@L@} \\text{ H}$ carries a current of $I = {@I@} \\text{ A}$.<br>Calculate the energy stored in the magnetic field.",
        variables: [
            { name: "L", type: "rand", value: "rand(10)+1" },
            { name: "I", type: "rand", value: "rand(5)+1" },
            { name: "ans1", type: "calc", value: "0.5 * L * I * I" }
        ],
        parts: [
            { 
                id: 1, 
                type: "numerical", 
                text: "Energy (Joules):", 
                answer: "ans1", 
                grading: {
                    tightTol: 0.05,
                    wideTol: 0.20,
                    checkSigFigs: true,
                    sigFigs: 3,
                    penalty: 0.1,
                    checkPowerOf10: true,
                    powerOf10Penalty: 0.5
                }
            }
        ]
    },
    kinematics: {
        name: "Physics: Kinematics (Units)",
        questionText: "A car accelerates from rest at $a = {@a@} \\text{ m/s}^2$ for $t = {@t@} \\text{ s}$.<br>What is the final speed? (Include units, e.g., m/s)",
        variables: [
            { name: "a", type: "rand", value: "rand(5)+1" },
            { name: "t", type: "rand", value: "rand(10)+5" },
            { name: "v_val", type: "calc", value: "a * t" },
            { name: "ans1", type: "algebraic", value: "v_val * (m/s)" }
        ],
        parts: [
            { 
                id: 1, 
                type: "units", 
                answer: "ans1", 
                text: "Final Speed:",
                grading: { tightTol: 0.05, wideTol: 0.1, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 }
            }
        ]
    },
    algebra_expansion: {
        name: "Math: Algebraic Expansion",
        questionText: "Expand the following expression completely: $(x + {@a@})(x - {@b@})$",
        variables: [
            { name: "a", type: "rand", value: "rand(9)+1" },
            { name: "b", type: "rand", value: "rand(9)+1" },
            { name: "ans1", type: "algebraic", value: "expand((x+a)*(x-b))" }
        ],
        parts: [
            { 
                id: 1, 
                type: "algebraic", 
                text: "Expanded form:", 
                answer: "ans1",
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 }
            }
        ]
    },
    calculus_int: {
        name: "Calculus: Definite Integral",
        questionText: "Evaluate the integral: \\[ \\int_{0}^{{@k@}} (3x^2 + {@c@}) \\, dx \\]",
        variables: [
            { name: "k", type: "rand", value: "rand(4)+1" },
            { name: "c", type: "rand", value: "rand(10)" },
            { name: "ans1", type: "algebraic", value: "integrate(3*x^2 + c, x, 0, k)" }
        ],
        parts: [
            { 
                id: 1, 
                type: "numerical", 
                text: "Value:", 
                answer: "ans1",
                grading: { tightTol: 0.01, wideTol: 0.05, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 }
            }
        ]
    },
    mcq_primes: {
        name: "General: Multiple Choice",
        questionText: "Which of the following integers is a prime number?",
        variables: [],
        parts: [
            {
                id: 1,
                type: "radio",
                text: "Choose one:",
                answer: "opt_ans1", 
                options: [
                    { value: "4", correct: false },
                    { value: "7", correct: true },
                    { value: "9", correct: false },
                    { value: "15", correct: false }
                ],
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 }
            }
        ]
    },
    jsxgraph_connect: {
        name: "Interactive: Connect the Dots (Graph Answer)",
        questionText: `Sketch the function \\(f(t)\\) by clicking on the graph to place points at the key locations.<br>
<small>Click to place 5 points. They will connect automatically.</small>`,
        variables: [
            { name: "t1", type: "rand", value: "10" },
            { name: "t2", type: "rand", value: "30" },
            { name: "t3", type: "rand", value: "40" },
            { name: "t4", type: "rand", value: "60" },
            { name: "p0", type: "algebraic", value: "[0, 0]" },
            { name: "p1", type: "algebraic", value: "[t1, 5*t1]" },
            { name: "p2", type: "algebraic", value: "[t2, -5*t2 + 100]" },
            { name: "p3", type: "algebraic", value: "[t3, -50]" },
            { name: "p4", type: "algebraic", value: "[t4, 0]" },
            { name: "correct_points", type: "algebraic", value: "[p0, p1, p2, p3, p4]" },
            { name: "ans1", type: "algebraic", value: "correct_points" } 
        ],
        parts: [
            { 
                id: 1, 
                type: "jsxgraph", 
                text: "Graph:", 
                answer: "ans1",
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                graphCode: `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-5, 70, 65, -70],
    axis: true,
    showNavigation: true,
    showCopyright: false,
    grid: true
});

// Axis labels
board.create('text', [62, -5, 't (s)'], {fontSize: 14});
board.create('text', [-3, 65, 'f(t)'], {fontSize: 14});

// State
var studentPoints = [];

board.on('down', function(e) {
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);
    
    if (studentPoints.length < 5) {
        var p = board.create('point', [x, y], {
            name: '(' + x + ',' + y + ')',
            size: 4, face: 'o', strokeColor: '#0000ff', fillColor: '#0000ff'
        });
        
        studentPoints.push(p);
        
        // Connect
        if (studentPoints.length > 1) {
            board.create('line', 
                [studentPoints[studentPoints.length-2], studentPoints[studentPoints.length-1]], 
                {straightFirst: false, straightLast: false, strokeColor: '#ff0000', strokeWidth: 2}
            );
        }
        
        updateAnswer();
    }
});

function updateAnswer() {
    var pointsArray = [];
    for (var i = 0; i < studentPoints.length; i++) {
        pointsArray.push('[' + studentPoints[i].X().toFixed(0) + ',' + 
                         studentPoints[i].Y().toFixed(0) + ']');
    }
    // 'ans1Ref' is injected by STACK to point to the correct input ID
    var inputEl = document.getElementById(ans1Ref);
    if(inputEl) inputEl.value = '[' + pointsArray.join(',') + ']';
}

// Reset button
board.create('button', [5, 60, 'Reset', function() {
    board.removeObject(studentPoints);
    studentPoints = [];
    var inputEl = document.getElementById(ans1Ref);
    if(inputEl) inputEl.value = '';
    // Re-init board if strictly necessary, but clearing objects usually enough
}]);`,
                gradingCode: `/* Check number of points */
correct_count: is(length(ans1) = 5);

/* Check each point with tolerance */
tolerance: 5;
pt_checks: makelist(
    is(abs(ans1[i][1] - correct_points[i][1]) < tolerance) and 
    is(abs(ans1[i][2] - correct_points[i][2]) < tolerance),
    i, 1, 5
);

/* All must be true */
all_correct: is(apply("and", pt_checks));`
            }
        ]
    }
};
