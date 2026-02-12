// Physics question templates

export const PHYSICS_TEMPLATES = {
    kinematics: {
        name: 'Physics: Kinematics (Units)',
        questionText: 'A car accelerates from rest at \\(a = {@a@} \\text{ m/s}^2\\) for \\(t = {@t@} \\text{ s}\\).',
        variables: [
            { name: 'a', type: 'rand', value: 'rand(5)+1' },
            { name: 't', type: 'rand', value: 'rand(10)+5' },
            { name: 'v_val', type: 'calc', value: 'a * t' },
            { name: 'ans1', type: 'algebraic', value: 'stackunits(v_val, m/s)' },
        ],
        parts: [
            {
                id: 1,
                type: 'units',
                text: 'What is the final speed? (include units, e.g., 15 m/s)',
                answer: 'ans1',
                grading: { tightTol: 0.05, wideTol: 0.1, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '',
                feedback: {
                    correct: 'Correct! \\(v = a \\cdot t\\).',
                    wrongUnits: 'Check your units. Speed should be in m/s.',
                },
            },
        ],
        generalFeedback: 'From \\(v = u + at\\) with \\(u = 0\\):<br>\\(v = {@a@} \\times {@t@} = {@v_val@}\\) m/s',
        hints: ['Starting from rest means initial velocity u = 0.', 'Use v = u + at.'],
        images: [],
    },

    projectile: {
        name: 'Physics: Projectile Motion',
        questionText: 'A ball is launched with initial speed \\(v_0 = {@v0@} \\text{ m/s}\\) at angle \\(\\theta = {@theta@}^\\circ\\) above the horizontal.',
        variables: [
            { name: 'v0', type: 'rand', value: 'rand([10, 15, 20, 25, 30])' },
            { name: 'theta', type: 'rand', value: 'rand([30, 45, 60])' },
            { name: 'theta_rad', type: 'calc', value: 'theta * pi / 180' },
            { name: 'ans1', type: 'calc', value: 'v0 * v0 * sin(2 * theta_rad) / 9.81' },
            { name: 'ans2', type: 'calc', value: '(v0 * sin(theta_rad))^2 / (2 * 9.81)' },
        ],
        parts: [
            {
                id: 1,
                type: 'numerical',
                text: 'Calculate the range (horizontal distance in metres):',
                answer: 'ans1',
                grading: { tightTol: 0.5, wideTol: 2.0, checkSigFigs: true, sigFigs: 3, penalty: 0.1, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct!', incorrect: 'Use \\(R = \\frac{v_0^2 \\sin(2\\theta)}{g}\\).' },
            },
            {
                id: 2,
                type: 'numerical',
                text: 'Calculate the maximum height (metres):',
                answer: 'ans2',
                grading: { tightTol: 0.3, wideTol: 1.0, checkSigFigs: true, sigFigs: 3, penalty: 0.1, checkPowerOf10: true, powerOf10Penalty: 0.5 },
                options: [], graphCode: '', gradingCode: '',
                feedback: { correct: 'Correct!', incorrect: 'Use \\(H = \\frac{(v_0 \\sin\\theta)^2}{2g}\\).' },
            },
        ],
        generalFeedback: 'Range: \\(R = \\frac{v_0^2 \\sin(2\\theta)}{g} = {@ans1@}\\) m<br>Max height: \\(H = \\frac{(v_0 \\sin\\theta)^2}{2g} = {@ans2@}\\) m',
        hints: ['Decompose the initial velocity into horizontal and vertical components.'],
        images: [],
    },
};
