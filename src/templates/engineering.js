// Engineering question templates

export const ENGINEERING_TEMPLATES = {
    inductor: {
        name: 'Engineering: Inductor Energy (Numerical)',
        questionText: 'An inductor with inductance \\(L = {@L@} \\text{ H}\\) carries a current of \\(I = {@I@} \\text{ A}\\).<br>Calculate the energy stored in the magnetic field.',
        variables: [
            { name: 'L', type: 'rand', value: 'rand(10)+1' },
            { name: 'I', type: 'rand', value: 'rand(5)+1' },
            { name: 'ans1', type: 'calc', value: '0.5 * L * I * I' },
        ],
        parts: [
            {
                id: 1,
                type: 'numerical',
                text: 'Energy (Joules):',
                answer: 'ans1',
                grading: { tightTol: 0.05, wideTol: 0.20, checkSigFigs: true, sigFigs: 3, penalty: 0.1, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct! The energy stored is \\(E = \\frac{1}{2}LI^2\\).',
                    incorrect: 'Incorrect. Remember the formula: \\(E = \\frac{1}{2}LI^2\\).',
                    powerOf10Error: 'Your answer is off by a power of 10. Check your units — is L in henries and I in amperes?',
                },
            },
        ],
        generalFeedback: 'The energy stored in an inductor is given by:\\[E = \\frac{1}{2}LI^2\\]Substituting \\(L = {@L@}\\) H and \\(I = {@I@}\\) A:\\[E = \\frac{1}{2} \\times {@L@} \\times {@I@}^2 = {@ans1@} \\text{ J}\\]',
        hints: ['What is the formula for energy stored in an inductor?', 'Remember: E = (1/2) L I^2. Make sure to square the current, not the inductance.'],
        images: [],
    },

    circuit_ohm: {
        name: 'Engineering: Circuit Analysis — Ohm\'s Law',
        questionText: 'A resistor of \\(R = {@R@} \\; \\Omega\\) is connected to a voltage source of \\(V = {@V@} \\text{ V}\\).',
        variables: [
            { name: 'R', type: 'rand', value: 'rand([100, 220, 330, 470, 680, 1000])' },
            { name: 'V', type: 'rand', value: 'rand([5, 9, 12, 24])' },
            { name: 'I_val', type: 'calc', value: 'V / R' },
            { name: 'P_val', type: 'calc', value: 'V * V / R' },
            { name: 'ans1', type: 'algebraic', value: 'V / R' },
            { name: 'ans2', type: 'algebraic', value: 'V^2 / R' },
        ],
        parts: [
            {
                id: 1,
                type: 'units',
                text: 'Calculate the current through the resistor (include units):',
                answer: 'ans1',
                grading: { tightTol: 0.001, wideTol: 0.01, checkSigFigs: true, sigFigs: 3, penalty: 0.1, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct! Ohm\'s Law: \\(I = V/R\\).',
                    wrongUnits: 'Check your units. Current should be in amperes (A) or milliamperes (mA).',
                },
            },
            {
                id: 2,
                type: 'units',
                text: 'Calculate the power dissipated by the resistor (include units):',
                answer: 'ans2',
                grading: { tightTol: 0.01, wideTol: 0.05, checkSigFigs: true, sigFigs: 3, penalty: 0.1, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct! Power: \\(P = V^2/R\\).',
                    incorrect: 'Incorrect. Use \\(P = V^2/R\\) or \\(P = I^2 R\\) or \\(P = VI\\).',
                },
            },
        ],
        generalFeedback: 'Using Ohm\'s Law: \\(I = V/R = {@V@}/{@R@}\\) A<br>Power: \\(P = V^2/R = {@V@}^2/{@R@}\\) W',
        hints: ['Apply Ohm\'s Law: V = IR.', 'For power, you can use P = V*I, P = I^2*R, or P = V^2/R.'],
        images: [],
    },

    circuit_series_parallel: {
        name: 'Engineering: Series-Parallel Circuit',
        questionText: 'Two resistors \\(R_1 = {@R1@} \\; \\Omega\\) and \\(R_2 = {@R2@} \\; \\Omega\\) are connected. Calculate the equivalent resistance for:',
        variables: [
            { name: 'R1', type: 'rand', value: 'rand([100, 220, 330, 470])' },
            { name: 'R2', type: 'rand', value: 'rand([100, 220, 330, 470])' },
            { name: 'ans1', type: 'calc', value: 'R1 + R2' },
            { name: 'ans2', type: 'calc', value: '(R1 * R2) / (R1 + R2)' },
        ],
        parts: [
            {
                id: 1,
                type: 'numerical',
                text: 'Series connection (\\(\\Omega\\)):',
                answer: 'ans1',
                grading: { tightTol: 0.01, wideTol: 0.1, checkSigFigs: false, sigFigs: 3, penalty: 0, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct! Series: \\(R_{eq} = R_1 + R_2\\).' },
            },
            {
                id: 2,
                type: 'numerical',
                text: 'Parallel connection (\\(\\Omega\\)):',
                answer: 'ans2',
                grading: { tightTol: 0.05, wideTol: 0.2, checkSigFigs: true, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct! Parallel: \\(R_{eq} = \\frac{R_1 R_2}{R_1 + R_2}\\).',
                    incorrect: 'For parallel: \\(\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2}\\).',
                },
            },
        ],
        generalFeedback: 'Series: \\(R_{eq} = R_1 + R_2 = {@R1@} + {@R2@} = {@ans1@} \\; \\Omega\\)<br>Parallel: \\(R_{eq} = \\frac{R_1 \\cdot R_2}{R_1 + R_2} = \\frac{{@R1@} \\cdot {@R2@}}{{@R1@} + {@R2@}} = {@ans2@} \\; \\Omega\\)',
        hints: ['For series: just add the resistances.', 'For parallel: use the product-over-sum formula.'],
        images: [],
    },
};
