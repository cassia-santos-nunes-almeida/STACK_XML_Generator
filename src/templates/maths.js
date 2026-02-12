// Mathematics question templates

export const MATHS_TEMPLATES = {
    algebra_expansion: {
        name: 'Maths: Algebraic Expansion',
        questionText: 'Expand the following expression completely: \\((x + {@a@})(x - {@b@})\\)',
        variables: [
            { name: 'a', type: 'rand', value: 'rand(9)+1' },
            { name: 'b', type: 'rand', value: 'rand(9)+1' },
            { name: 'ans1', type: 'algebraic', value: 'expand((x+a)*(x-b))' },
        ],
        parts: [
            {
                id: 1,
                type: 'algebraic',
                text: 'Expanded form:',
                answer: 'ans1',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct! The expansion is complete.', incorrect: 'Use FOIL or distributive property to expand.' },
            },
        ],
        generalFeedback: '\\((x + {@a@})(x - {@b@}) = x^2 + ({@a@} - {@b@})x - {@a@} \\cdot {@b@}\\)',
        hints: ['Use the FOIL method: First, Outer, Inner, Last.'],
        images: [],
    },

    calculus_int: {
        name: 'Maths: Definite Integral',
        questionText: 'Evaluate the integral: \\[ \\int_{0}^{{@k@}} (3x^2 + {@c@}) \\, dx \\]',
        variables: [
            { name: 'k', type: 'rand', value: 'rand(4)+1' },
            { name: 'c', type: 'rand', value: 'rand(10)' },
            { name: 'ans1', type: 'algebraic', value: 'integrate(3*x^2 + c, x, 0, k)' },
        ],
        parts: [
            {
                id: 1,
                type: 'numerical',
                text: 'Value:',
                answer: 'ans1',
                grading: { tightTol: 0.01, wideTol: 0.05, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct!', incorrect: 'Remember to integrate term by term and evaluate at the limits.' },
            },
        ],
        generalFeedback: '\\(\\int_0^{{@k@}} (3x^2 + {@c@})\\,dx = [x^3 + {@c@}x]_0^{{@k@}} = {@k@}^3 + {@c@} \\cdot {@k@} = {@ans1@}\\)',
        hints: ['The antiderivative of 3x^2 is x^3, and the antiderivative of a constant c is cx.'],
        images: [],
    },

    diff_equation: {
        name: 'Maths: First-Order Differential Equation',
        questionText: 'Solve the differential equation: \\[ \\frac{dy}{dx} = {@a@}x + {@b@} \\] with initial condition \\(y(0) = {@y0@}\\).',
        variables: [
            { name: 'a', type: 'rand', value: 'rand(5)+1' },
            { name: 'b', type: 'rand', value: 'rand(8)+1' },
            { name: 'y0', type: 'rand', value: 'rand(5)' },
            { name: 'ans1', type: 'algebraic', value: 'a*x^2/2 + b*x + y0' },
        ],
        parts: [
            {
                id: 1,
                type: 'algebraic',
                text: 'Find \\(y(x)\\):',
                answer: 'ans1',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct! Well done integrating and applying the initial condition.',
                    incorrect: 'Integrate both sides and use y(0) to find the constant of integration.',
                },
            },
        ],
        generalFeedback: 'Integrating: \\(y = \\int ({@a@}x + {@b@})\\,dx = \\frac{{@a@}}{2}x^2 + {@b@}x + C\\)<br>Using \\(y(0) = {@y0@}\\): \\(C = {@y0@}\\)<br>So \\(y(x) = \\frac{{@a@}}{2}x^2 + {@b@}x + {@y0@}\\)',
        hints: ['Integrate the right-hand side with respect to x.', 'Don\'t forget the constant of integration C. Use the initial condition to find it.'],
        images: [],
    },

    matrix_operations: {
        name: 'Maths: Matrix Operations',
        questionText: 'Given the matrices:<br>\\[ A = \\begin{pmatrix} {@a11@} & {@a12@} \\\\ {@a21@} & {@a22@} \\end{pmatrix}, \\quad B = \\begin{pmatrix} {@b11@} & {@b12@} \\\\ {@b21@} & {@b22@} \\end{pmatrix} \\]',
        variables: [
            { name: 'a11', type: 'rand', value: 'rand(5)+1' },
            { name: 'a12', type: 'rand', value: 'rand(5)' },
            { name: 'a21', type: 'rand', value: 'rand(5)' },
            { name: 'a22', type: 'rand', value: 'rand(5)+1' },
            { name: 'b11', type: 'rand', value: 'rand(5)+1' },
            { name: 'b12', type: 'rand', value: 'rand(5)' },
            { name: 'b21', type: 'rand', value: 'rand(5)' },
            { name: 'b22', type: 'rand', value: 'rand(5)+1' },
            { name: 'A', type: 'algebraic', value: 'matrix([a11, a12], [a21, a22])' },
            { name: 'B', type: 'algebraic', value: 'matrix([b11, b12], [b21, b22])' },
            { name: 'ans1', type: 'algebraic', value: 'A + B' },
            { name: 'ans2', type: 'algebraic', value: 'A . B' },
            { name: 'det_val', type: 'calc', value: 'a11 * a22 - a12 * a21' },
            { name: 'ans3', type: 'algebraic', value: 'determinant(A)' },
        ],
        parts: [
            {
                id: 1,
                type: 'matrix',
                text: 'Calculate \\(A + B\\):',
                answer: 'ans1',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct! Add corresponding elements.', incorrect: 'Add element by element: (A+B)_{ij} = A_{ij} + B_{ij}.' },
            },
            {
                id: 2,
                type: 'matrix',
                text: 'Calculate \\(A \\cdot B\\) (matrix product):',
                answer: 'ans2',
                grading: { tightTol: 0, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct!', incorrect: 'Row of A times column of B: (AB)_{ij} = sum of A_{ik} * B_{kj}.' },
            },
            {
                id: 3,
                type: 'numerical',
                text: 'Calculate \\(\\det(A)\\):',
                answer: 'ans3',
                grading: { tightTol: 0.01, wideTol: 0.1, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct!', incorrect: 'For a 2x2 matrix: det = a11*a22 - a12*a21.' },
            },
        ],
        generalFeedback: 'Matrix addition: add element by element.<br>Matrix multiplication: row times column.<br>Determinant of 2x2: \\(\\det(A) = a_{11}a_{22} - a_{12}a_{21} = {@a11@} \\cdot {@a22@} - {@a12@} \\cdot {@a21@} = {@det_val@}\\)',
        hints: ['For matrix addition, add corresponding elements.', 'For matrix multiplication, multiply row of first matrix by column of second.'],
        images: [],
    },
};
