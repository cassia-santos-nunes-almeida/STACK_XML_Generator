// STACK Answer Test identifiers used in Moodle STACK plugin
export const ANSWER_TESTS = {
    NUM_ABSOLUTE: 'ATNumAbs',
    NUM_RELATIVE: 'ATNumRelative',
    NUM_SIG_FIGS: 'ATNumSigFigs',
    ALG_EQUIV: 'AlgEquiv',
    UNITS: 'ATUnits',
    UNITS_STRICT: 'ATUnitsStrict',
    STRING: 'String',
    STRING_SLOPPY: 'StringSloppy',
    SAME_TYPE: 'ATSameType',
    CAS_EQUAL: 'CASEqual',
};

// Input types supported by STACK
export const INPUT_TYPES = {
    NUMERICAL: 'numerical',
    ALGEBRAIC: 'algebraic',
    UNITS: 'units',
    RADIO: 'radio',
    MATRIX: 'matrix',
    STRING: 'string',
    JSXGRAPH: 'jsxgraph',
    NOTES: 'notes',
};

// Score modes for PRT nodes
export const SCORE_MODES = {
    SET: '=',
    ADD: '+',
    SUBTRACT: '-',
};

// Grading presets for quick configuration
export const GRADING_PRESETS = {
    engineering: {
        label: 'Engineering (Standard)',
        description: 'Industry-standard tolerances, 3 significant figures, power-of-10 check',
        tightTol: 0.05,
        wideTol: 0.20,
        checkSigFigs: true,
        sigFigs: 3,
        penalty: 0.1,
        checkPowerOf10: true,
        powerOf10Penalty: 0.5,
    },
    physicsLab: {
        label: 'Physics Lab (Strict)',
        description: 'Tight tolerances for experimental work, 4 significant figures',
        tightTol: 0.01,
        wideTol: 0.05,
        checkSigFigs: true,
        sigFigs: 4,
        penalty: 0.1,
        checkPowerOf10: true,
        powerOf10Penalty: 0.5,
    },
    conceptual: {
        label: 'Conceptual (Wide)',
        description: 'Wide margins for estimation and conceptual understanding',
        tightTol: 0.15,
        wideTol: 0.50,
        checkSigFigs: false,
        sigFigs: 2,
        penalty: 0,
        checkPowerOf10: false,
        powerOf10Penalty: 0,
    },
    exact: {
        label: 'Exact Match',
        description: 'No tolerance, answer must be exactly correct',
        tightTol: 0,
        wideTol: 0,
        checkSigFigs: false,
        sigFigs: 3,
        penalty: 0,
        checkPowerOf10: false,
        powerOf10Penalty: 0,
    },
};

// Default grading configuration for new parts
export const DEFAULT_GRADING = {
    tightTol: 0.05,
    wideTol: 0.20,
    checkSigFigs: true,
    sigFigs: 3,
    penalty: 0.1,
    checkPowerOf10: true,
    powerOf10Penalty: 0.5,
};

// Default feedback messages (customizable by teachers)
export const DEFAULT_FEEDBACK = {
    correct: 'Correct! Well done.',
    incorrect: 'Incorrect. Please try again.',
    closeButInaccurate: 'Close, but check your accuracy. Review your calculation steps.',
    wrongSigFigs: 'Your answer has the wrong number of significant figures. Check the precision required.',
    powerOf10Error: 'Your answer appears to be off by a power of 10. Check your unit conversions or decimal placement.',
    wrongUnits: 'Check the units of your answer.',
    partialCredit: 'Partially correct. You are on the right track.',
    notesReceived: 'Thank you for showing your reasoning. Your working will be reviewed by your teacher.',
    prerequisiteNotMet: 'Please answer the prerequisite part correctly before attempting this part.',
};

// JSXGraph preset templates for common graph types
export const GRAPH_PRESETS = {
    pointPlacement: {
        label: 'Point Placement',
        description: 'Students place points on a graph',
        maxPoints: 5,
    },
    functionSketch: {
        label: 'Function Sketch',
        description: 'Students sketch a function by placing control points',
        maxPoints: 10,
    },
    vectorDraw: {
        label: 'Vector Drawing',
        description: 'Students draw vectors on a coordinate plane',
        maxPoints: 4,
    },
};

// Maxima syntax examples for the helpers panel
export const SYNTAX_EXAMPLES = {
    random: [
        { syntax: 'rand(10)', description: 'Random integer 0-9', example: '→ 7' },
        { syntax: 'rand(10)+1', description: 'Random integer 1-10', example: '→ 4' },
        { syntax: 'rand([2, 3, 5, 7])', description: 'Random from list', example: '→ 5' },
        { syntax: 'rand_with_step(1, 10, 0.5)', description: 'Random with step', example: '→ 3.5' },
        { syntax: 'rand(5)+1 + rand(3)/10', description: 'Mixed random', example: '→ 4.2' },
    ],
    arithmetic: [
        { syntax: 'a + b', description: 'Addition', example: '3 + 4 → 7' },
        { syntax: 'a * b', description: 'Multiplication', example: '3 * 4 → 12' },
        { syntax: 'a / b', description: 'Division', example: '10 / 3 → 10/3' },
        { syntax: 'a ^ b', description: 'Power / Exponent', example: '2 ^ 3 → 8' },
        { syntax: 'sqrt(x)', description: 'Square root', example: 'sqrt(16) → 4' },
        { syntax: 'abs(x)', description: 'Absolute value', example: 'abs(-5) → 5' },
    ],
    trigonometry: [
        { syntax: 'sin(x)', description: 'Sine (radians)', example: 'sin(%pi/2) → 1' },
        { syntax: 'cos(x)', description: 'Cosine (radians)', example: 'cos(0) → 1' },
        { syntax: 'tan(x)', description: 'Tangent (radians)', example: 'tan(%pi/4) → 1' },
        { syntax: 'atan2(y, x)', description: 'Angle from coordinates', example: 'atan2(1,1) → %pi/4' },
    ],
    calculus: [
        { syntax: 'diff(expr, x)', description: 'Derivative', example: 'diff(x^3, x) → 3*x^2' },
        { syntax: 'integrate(expr, x)', description: 'Indefinite integral', example: 'integrate(x^2, x) → x^3/3' },
        { syntax: 'integrate(expr, x, a, b)', description: 'Definite integral', example: 'integrate(x, x, 0, 1) → 1/2' },
    ],
    linearAlgebra: [
        { syntax: 'matrix([1,2],[3,4])', description: 'Create matrix', example: '[[1,2],[3,4]]' },
        { syntax: 'A . B', description: 'Matrix multiply', example: 'A . B' },
        { syntax: 'invert(A)', description: 'Matrix inverse', example: 'invert(matrix([1,2],[3,4]))' },
        { syntax: 'determinant(A)', description: 'Determinant', example: 'determinant(matrix([1,2],[3,4])) → -2' },
        { syntax: 'transpose(A)', description: 'Transpose', example: 'transpose(matrix([1,2],[3,4]))' },
    ],
    formatting: [
        { syntax: 'decimalplaces(x, n)', description: 'Round to n decimals', example: 'decimalplaces(3.14159, 2) → 3.14' },
        { syntax: 'significantfigures(x, n)', description: 'Round to n sig figs', example: 'significantfigures(0.00456, 2) → 0.0046' },
        { syntax: 'scientific_notation(x)', description: 'Scientific notation', example: '0.005 → 5*10^-3' },
    ],
    units: [
        { syntax: 'stackunits(5, m/s)', description: 'Value with units', example: '5 m/s' },
        { syntax: 'stackunits(val, kg*m/s^2)', description: 'Compound units', example: 'Force in N' },
        { syntax: 'stackunits(val, V)', description: 'Electrical units', example: 'Voltage' },
    ],
};
