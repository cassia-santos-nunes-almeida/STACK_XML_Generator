// XML parser for importing STACK question XML back into the editor
// FIXES BUG 4: MCQ round-trip now correctly recovers options from ta_ansX variables
import { INPUT_TYPES, DEFAULT_GRADING } from '../core/constants.js';
import { detectVariableType, parseVariableDefinition } from './variable-parser.js';

/**
 * Parses a STACK question XML string into an editor state object.
 *
 * @param {string} xmlString - Raw XML content
 * @returns {object} State object compatible with StateManager
 */
export function parseStackXML(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Validate
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error('Invalid XML: ' + parseError.textContent.substring(0, 100));
    }
    const qNode = doc.querySelector('question');
    if (!qNode || qNode.getAttribute('type') !== 'stack') {
        throw new Error('Invalid file format: Not a STACK question XML.');
    }

    const state = {
        name: '',
        questionText: '',
        variables: [],
        parts: [],
        images: [],
        generalFeedback: '',
        hints: [],
    };

    // 1. Name
    state.name = doc.querySelector('name text')?.textContent || 'Imported Question';

    // 2. General feedback (worked solution)
    state.generalFeedback = doc.querySelector('generalfeedback text')?.textContent || '';

    // 3. Hints
    doc.querySelectorAll('hint text').forEach(h => {
        const text = h.textContent?.trim();
        if (text) state.hints.push(text);
    });

    // 4. Variables
    const varText = doc.querySelector('questionvariables text')?.textContent || '';
    const varDefs = varText.split(';').map(s => s.trim()).filter(s => s);

    const radioVarMap = {}; // ta_ansX -> parsed options

    varDefs.forEach(vStr => {
        const parsed = parseVariableDefinition(vStr);
        if (!parsed) return;

        // Detect MCQ helper variables (ta_ansX format)
        if (parsed.name.startsWith('ta_ans')) {
            const ansName = parsed.name.replace('ta_', '');
            radioVarMap[ansName] = parseRadioOptions(parsed.value);
            return;
        }

        // Skip old-format opt_ansX variables too
        if (parsed.name.startsWith('opt_ans')) return;

        // Skip teacher-answer aliases for power-of-10 detection (tans_ansX)
        if (parsed.name.startsWith('tans_')) return;

        const type = detectVariableType(parsed.value);
        state.variables.push({
            name: parsed.name,
            type: type,
            value: parsed.value,
        });
    });

    // 5. Images
    const fileNodes = doc.querySelectorAll('questiontext file');
    fileNodes.forEach(f => {
        const name = f.getAttribute('name');
        const b64 = f.textContent;
        const ext = name?.split('.').pop()?.toLowerCase() || 'png';
        const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml' };
        const mime = mimeMap[ext] || 'image/png';
        state.images.push({
            name: name,
            data: `data:${mime};base64,${b64}`,
        });
    });

    // 6. Question text — separate intro from parts
    const qtNode = doc.querySelector('questiontext text');
    let htmlContent = qtNode?.textContent || '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Remove image artifacts
    const imgDiv = tempDiv.querySelector('.stack-images');
    if (imgDiv) imgDiv.remove();

    // Extract part texts
    const partTexts = {};
    const partDivs = tempDiv.querySelectorAll('.stack-part');
    partDivs.forEach(pd => {
        const pTag = pd.querySelector('p');
        if (pTag) {
            const cloneP = pTag.cloneNode(true);
            const strong = cloneP.querySelector('strong');
            if (strong) strong.remove();
            let text = cloneP.innerHTML.trim();

            const match = pd.innerHTML.match(/\[\[input:(ans\d+)\]\]/);
            if (match) {
                partTexts[match[1]] = text;
            }
        }

        // Detect JSXGraph code
        const jsxMatch = pd.innerHTML.match(/\[\[jsxgraph[^\]]*\]\]([\s\S]*?)\[\[\/jsxgraph\]\]/);
        if (jsxMatch) {
            const ansMatch = pd.innerHTML.match(/\[\[input:(ans\d+)\]\]/);
            if (ansMatch) {
                partTexts[ansMatch[1] + '_graphCode'] = jsxMatch[1].trim();
            }
        }

        pd.remove();
    });

    state.questionText = tempDiv.innerHTML.trim();

    // 7. Inputs (Parts)
    const inputs = doc.querySelectorAll('input');
    inputs.forEach(inp => {
        const name = inp.querySelector('name')?.textContent;
        const type = inp.querySelector('type')?.textContent;
        const tans = inp.querySelector('tans')?.textContent;
        if (!name) return;

        const part = {
            id: parseInt(name.replace('ans', '')) || (state.parts.length + 1),
            type: INPUT_TYPES.NUMERICAL,
            text: partTexts[name] || '',
            answer: name,
            options: [],
            grading: { ...DEFAULT_GRADING },
            graphCode: partTexts[name + '_graphCode'] || '',
            gradingCode: '',
            feedback: {},
        };

        // Type mapping
        if (type === 'algebraic') {
            // Could be algebraic or jsxgraph — check for graph code
            part.type = part.graphCode ? INPUT_TYPES.JSXGRAPH : INPUT_TYPES.ALGEBRAIC;
        } else if (type === 'numerical') {
            part.type = INPUT_TYPES.NUMERICAL;
        } else if (type === 'units') {
            part.type = INPUT_TYPES.UNITS;
        } else if (type === 'string') {
            part.type = INPUT_TYPES.STRING;
        } else if (type === 'matrix') {
            part.type = INPUT_TYPES.MATRIX;
        } else if (type === 'radio' || type === 'dropdown') {
            part.type = INPUT_TYPES.RADIO;
            // Recover options from ta_ansX variable (FIXES BUG 4)
            if (radioVarMap[name]) {
                part.options = radioVarMap[name];
            }
        }

        // 8. Analyze PRT for grading settings
        const prtName = name.replace('ans', 'prt');
        const prt = Array.from(doc.querySelectorAll('prt'))
            .find(p => p.querySelector('name')?.textContent === prtName);

        if (prt) {
            // Check for JSXGraph grading code
            const fbVars = prt.querySelector('feedbackvariables text')?.textContent || '';
            if (fbVars.includes('all_correct') || fbVars.includes('pt_checks')) {
                part.type = INPUT_TYPES.JSXGRAPH;
                part.gradingCode = fbVars.trim();
            }

            // Power of 10 detection
            if (fbVars.includes('is_p10') || fbVars.includes('p10_ratio')) {
                part.grading.checkPowerOf10 = true;
            }

            // Analyze nodes for tolerances and feedback
            const nodes = prt.querySelectorAll('node');
            nodes.forEach(node => {
                const nodeId = node.querySelector('name')?.textContent;
                const testType = node.querySelector('answertest')?.textContent;
                const testOpt = node.querySelector('testoptions')?.textContent;

                // Extract custom feedback messages
                const trueFb = node.querySelector('truefeedback text')?.textContent?.trim();
                const falseFb = node.querySelector('falsefeedback text')?.textContent?.trim();

                if (part.type === INPUT_TYPES.NUMERICAL || part.type === INPUT_TYPES.UNITS) {
                    if (testType === 'ATNumAbs' || testType === 'ATUnits') {
                        if (nodeId === '0') {
                            part.grading.wideTol = parseFloat(testOpt) || 0.2;
                            if (falseFb) part.feedback.incorrect = falseFb;
                        }
                        if (nodeId === '1') {
                            part.grading.tightTol = parseFloat(testOpt) || 0.05;
                            if (trueFb) part.feedback.correct = trueFb;
                            if (falseFb) part.feedback.closeButInaccurate = falseFb;
                        }
                    }
                    if (testType === 'ATNumSigFigs') {
                        part.grading.checkSigFigs = true;
                        part.grading.sigFigs = parseInt(testOpt) || 3;
                        if (falseFb) part.feedback.wrongSigFigs = falseFb;
                    }
                }

                // MCQ: recover correct answer
                if (part.type === INPUT_TYPES.RADIO && nodeId === '0') {
                    const correctTans = node.querySelector('tans')?.textContent;
                    if (correctTans && part.options.length > 0) {
                        const correctIdx = parseInt(correctTans) - 1;
                        if (correctIdx >= 0 && correctIdx < part.options.length) {
                            part.options[correctIdx].correct = true;
                        }
                    }
                }
            });
        }

        state.parts.push(part);
    });

    // Sort parts by ID
    state.parts.sort((a, b) => a.id - b.id);

    return state;
}

/**
 * Parses STACK radio option list: [[label, true/false], ...]
 */
function parseRadioOptions(value) {
    try {
        const trimmed = value.trim();
        if (!trimmed.startsWith('[')) return [];

        // Parse the nested list structure
        const options = [];
        const innerMatch = trimmed.match(/\[([^\[\]]*(?:\[[^\]]*\][^\[\]]*)*)\]/);
        if (!innerMatch) return [];

        // Split by ], [ to get individual option pairs
        const pairs = trimmed.match(/\["([^"]*)",\s*(true|false)\]/g);
        if (!pairs) return [];

        pairs.forEach(pair => {
            const m = pair.match(/\["([^"]*)",\s*(true|false)\]/);
            if (m) {
                options.push({
                    value: m[1].replace(/\\"/g, '"'),
                    correct: m[2] === 'true',
                });
            }
        });

        return options;
    } catch {
        return [];
    }
}
