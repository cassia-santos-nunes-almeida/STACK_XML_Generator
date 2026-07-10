// XML parser for importing STACK question XML back into the editor
// FIXES BUG 4: MCQ round-trip now correctly recovers options from ta_ansX variables
import { INPUT_TYPES, DEFAULT_GRADING } from '../core/constants.js';
import { detectVariableType, parseVariableDefinition, splitMaximaStatements } from './variable-parser.js';
import { migrateLegacyTeacherAnswers } from '../core/migrate-teacher-answer.js';
import { modelInputValue, parsePrtGraph } from '../generators/qtest-generator.js';
import { generatePRT } from '../generators/prts/prt-factory.js';
import STACK_RULES from '../core/stack-rules.json' with { type: 'json' };

const SIMPLE_TYPE_MAP = {
    numerical: INPUT_TYPES.NUMERICAL,
    units: INPUT_TYPES.UNITS,
    string: INPUT_TYPES.STRING,
    matrix: INPUT_TYPES.MATRIX,
};

// Grading-structure detection accepts BOTH the canonical v4.9.1 names and
// the legacy AT-prefixed names this app emitted before A1 — old exports
// heal on import (X1). Tolerance-based tests carry a tolerance in
// testoptions; sig-figs tests carry a digit count.
const TOLERANCE_TESTS = new Set([
    'NumAbsolute', 'ATNumAbs',
    'NumRelative', 'ATNumRelative',
    'UnitsAbsolute', 'ATUnits',
    'UnitsRelative',
    'UnitsStrictAbsolute', 'ATUnitsStrict',
    'UnitsStrictRelative',
]);
const SIGFIGS_TESTS = new Set(['NumSigFigs', 'ATNumSigFigs']);
const RELATIVE_TESTS = new Set(['NumRelative', 'ATNumRelative', 'UnitsRelative', 'UnitsStrictRelative']);

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
    // F3: statement-aware split — a ";" inside a string literal, a
    // parenthesised compound, or a comment must not truncate the variable.
    const varDefs = splitMaximaStatements(varText);

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

    // 4.5 Variable-type recovery from the questionnote (F4-prep): the note
    // lists every rand variable as "name={@name@}". A rand-typed variable
    // whose value happens to be constant (e.g. "t1: 10") would otherwise
    // degrade to calc on import — silently dropping it from the note and
    // the deployed seeds on re-export.
    const noteText = doc.querySelector('questionnote text')?.textContent || '';
    for (const m of noteText.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)=\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g)) {
        if (m[1] !== m[2]) continue; // taN/part refs are keyed by ansN, not by their own name
        const v = state.variables.find(x => x.name === m[1]);
        if (v && v.type !== 'rand') v.type = 'rand';
    }

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

            const match = pd.innerHTML.match(/\[\[input:([A-Za-z_][A-Za-z0-9_]*)\]\]/);
            if (match) {
                partTexts[match[1]] = text;
            }
        }

        // Detect JSXGraph code. Extract from TEXT (not innerHTML): the graph
        // code is JavaScript living in a text node, and innerHTML would
        // entity-escape it (&& -> &amp;&amp;, >= -> &gt;=), so a re-export
        // after import would ship corrupted code (F4-prep).
        const jsxBox = pd.querySelector('.jsxgraph-box');
        const jsxSource = jsxBox ? jsxBox.textContent : pd.innerHTML;
        const jsxMatch = jsxSource.match(/\[\[jsxgraph[^\]]*\]\]([\s\S]*?)\[\[\/jsxgraph\]\]/);
        if (jsxMatch) {
            const ansMatch = pd.innerHTML.match(/\[\[input:([A-Za-z_][A-Za-z0-9_]*)\]\]/);
            if (ansMatch) {
                partTexts[ansMatch[1] + '_graphCode'] = jsxMatch[1].trim();
            }
        }

        // Detect image upload instruction for notes parts
        const imgInstruction = pd.innerHTML.includes('photograph or scan your handwritten');
        if (imgInstruction) {
            const ansMatch = pd.innerHTML.match(/\[\[input:([A-Za-z_][A-Za-z0-9_]*)\]\]/);
            if (ansMatch) {
                partTexts[ansMatch[1] + '_notesRequireImage'] = true;
            }
        }

        // Detect prerequisite notice
        const prereqNotice = pd.querySelector('.prerequisite-notice');
        if (prereqNotice) {
            const prereqMatch = prereqNotice.textContent.match(/part \(([a-z])\)/);
            const ansMatch = pd.innerHTML.match(/\[\[input:([A-Za-z_][A-Za-z0-9_]*)\]\]/);
            if (prereqMatch && ansMatch) {
                partTexts[ansMatch[1] + '_prerequisite'] = prereqMatch[1].charCodeAt(0) - 96;
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
            // A2: <tans> names the teacher-answer variable. A tans equal to
            // the input name is the legacy self-comparison defect — leave
            // teacherAnswer empty here and let migrateLegacyTeacherAnswers
            // heal it (rename colliding qv, rewrite references, notice).
            teacherAnswer: tans && tans.trim() !== name ? tans.trim() : '',
            options: [],
            // Start detection-driven grading flags OFF: analyzePRT switches
            // them on when the corresponding node/fv is actually present.
            // (Spreading the raw defaults used to re-export phantom
            // sig-figs / power-of-10 nodes that the imported XML never had.)
            // tolType starts 'absolute' — an import PRESERVES the file's
            // grading semantics (A11); analyzePRT flips to 'relative' only
            // when the XML actually carries a relative answertest.
            grading: { ...DEFAULT_GRADING, checkSigFigs: false, checkPowerOf10: false, tolType: 'absolute' },
            graphCode: partTexts[name + '_graphCode'] || '',
            gradingCode: '',
            feedback: {},
        };

        // Type mapping
        if (type === 'algebraic') {
            // Could be algebraic or jsxgraph — check for graph code
            part.type = part.graphCode ? INPUT_TYPES.JSXGRAPH : INPUT_TYPES.ALGEBRAIC;
        } else if (type === 'notes') {
            part.type = INPUT_TYPES.NOTES;
            part.notesAutoCredit = true;
            part.notesRequireImage = false;
            const boxSize = parseInt(inp.querySelector('boxsize')?.textContent);
            if (Number.isFinite(boxSize)) part.notesBoxSize = boxSize;
            const hint = inp.querySelector('syntaxhint')?.textContent;
            if (hint) part.notesSyntaxHint = hint;
        } else if (type === 'radio' || type === 'dropdown') {
            part.type = INPUT_TYPES.RADIO;
            // Recover options from ta_ansX variable (FIXES BUG 4)
            if (radioVarMap[name]) {
                part.options = radioVarMap[name];
            }
        } else if (SIMPLE_TYPE_MAP[type]) {
            part.type = SIMPLE_TYPE_MAP[type];
        }

        // 8. Analyze PRT for grading settings
        analyzePRT(doc, part, name, type);

        // Recover notes image requirement from question text
        if (partTexts[name + '_notesRequireImage']) {
            part.notesRequireImage = true;
        }

        // Recover prerequisite from question text
        if (partTexts[name + '_prerequisite']) {
            part.prerequisite = partTexts[name + '_prerequisite'];
        }

        state.parts.push(part);
    });

    // Sort parts by ID
    state.parts.sort((a, b) => a.id - b.id);

    // A5 (X1): deployed seeds roundtrip as data; question tests are HEALED,
    // not preserved — the app re-derives qtests from the PRT graph on
    // export, so only the curated wrong-answer inputs (distractors) are
    // recovered here. Foreign/warming-only qtests are replaced by canonical
    // derived ones.
    const seeds = Array.from(doc.querySelectorAll('deployedseed'))
        .map(s => parseInt(s.textContent.trim()))
        .filter(n => Number.isFinite(n));
    if (seeds.length > 0) state.deployedSeeds = seeds;
    recoverDistractors(doc, state);

    // A2: heal legacy input-name/variable collisions (rename + rewrite +
    // plain-language notice for the UI).
    const migratedIds = new Set();
    const notices = migrateLegacyTeacherAnswers(state, migratedIds);

    // F4: importing a question whose PRT this editor cannot fully represent
    // used to REPLACE the grading logic silently on re-export (partial
    // credit, extra branches, and custom feedbackvariables vanished with no
    // notice). Detect it by regenerating each PRT from the recovered state
    // and comparing the grading structure with what the file actually holds.
    // Parts the A2 migration just healed already carry their own (stronger,
    // more accurate) notice.
    notices.push(...detectUnrecoveredPrts(doc, state, migratedIds));

    if (notices.length > 0) state.importNotices = notices;

    return state;
}

/**
 * F4: one notice per part whose imported PRT does not structurally match
 * what the editor would re-export from the recovered state.
 */
function detectUnrecoveredPrts(doc, state, skipIds = new Set()) {
    const notices = [];
    const allParts = state.parts || [];
    const ctx = { variables: state.variables || [] };
    const prtEls = Array.from(doc.querySelectorAll('prt'));
    const canonical = t => STACK_RULES.legacyAliases[t] || t || '';
    const num = s => {
        const t = (s ?? '').toString().trim();
        if (t === '') return '';
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : t;
    };
    const normFv = fv => String(fv || '')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const sig = n => JSON.stringify([
        n.id, canonical(n.answertest), n.sans, n.tans, num(n.testoptions),
        n.tMode, num(n.tScore), n.tNext, n.tNote,
        n.fMode, num(n.fScore), n.fNext, n.fNote,
    ]);

    allParts.forEach((part, idx) => {
        if (skipIds.has(part.id)) return;
        const prtName = `prt${part.id || idx + 1}`;
        const label = String.fromCharCode(96 + (part.id || idx + 1));
        const notice = `Part (${label}): this file's grading logic contains structure this editor cannot represent. If you export from here, the grading will be REBUILT in the editor's standard style — custom partial credit, extra branches, or custom feedback variables from the original file will be replaced. Compare the re-exported question against the original in Moodle before giving it to students.`;
        const prtEl = prtEls.find(p => p.querySelector('name')?.textContent === prtName);

        let generated;
        try {
            generated = generatePRT(part, idx, allParts, ctx);
        } catch {
            generated = null;
        }
        if (!prtEl || !generated) {
            notices.push(notice);
            return;
        }

        const gen = parsePrtGraph(generated);
        const genSigs = [...gen.nodes.values()].map(n => sig({
            id: n.id, answertest: n.answertest, sans: n.sans, tans: n.tans,
            testoptions: n.testoptions,
            tMode: n.t.mode, tScore: n.t.score, tNext: n.t.next, tNote: n.t.note,
            fMode: n.f.mode, fScore: n.f.score, fNext: n.f.next, fNote: n.f.note,
        }));

        const g = (el, tag) => el.querySelector(`:scope > ${tag}`)?.textContent?.trim() ?? '';
        const impSigs = Array.from(prtEl.querySelectorAll('node')).map(n => sig({
            id: g(n, 'name'), answertest: g(n, 'answertest'), sans: g(n, 'sans'), tans: g(n, 'tans'),
            testoptions: g(n, 'testoptions'),
            tMode: g(n, 'truescoremode'), tScore: parseFloat(g(n, 'truescore')), tNext: g(n, 'truenextnode'), tNote: g(n, 'trueanswernote'),
            fMode: g(n, 'falsescoremode'), fScore: parseFloat(g(n, 'falsescore')), fNext: g(n, 'falsenextnode'), fNote: g(n, 'falseanswernote'),
        }));
        const impFv = prtEl.querySelector('feedbackvariables text')?.textContent || '';

        const same = impSigs.length === genSigs.length
            && impSigs.every((s, i) => s === genSigs[i])
            && normFv(impFv) === normFv(gen.fv);
        if (!same) notices.push(notice);
    });
    return notices;
}

/**
 * Recovers curated distractor inputs from imported <qtest> blocks: any
 * testinput whose value is neither the part's model-answer value nor the
 * insertstars pin ("2x") is treated as that part's wrong-answer distractor.
 */
function recoverDistractors(doc, state) {
    const ctx = { variables: state.variables };
    doc.querySelectorAll('qtest').forEach(qt => {
        qt.querySelectorAll('testinput').forEach(ti => {
            const name = ti.querySelector('name')?.textContent?.trim();
            const value = ti.querySelector('value')?.textContent?.trim();
            if (!name || !value) return;
            const part = state.parts.find(p => p.answer === name);
            if (!part || part.distractor !== undefined) return;
            if (part.type === 'algebraic' && value === '2x') return;
            let model;
            try {
                model = modelInputValue(part, ctx);
            } catch {
                return;
            }
            if (value !== model) part.distractor = value;
        });
    });
}

/**
 * Analyzes the PRT (Potential Response Tree) for a part and populates
 * grading settings, feedback, and type overrides.
 */
function analyzePRT(doc, part, name, type) {
    // PRT names follow the PART id (prt{id}), which equals the ansN number
    // for ansN inputs but NOT for notes inputs (notesN) — derive from the id.
    const prtName = `prt${part.id}`;
    const prt = Array.from(doc.querySelectorAll('prt'))
        .find(p => p.querySelector('name')?.textContent === prtName);

    if (!prt) return;

    // Check for JSXGraph grading code
    const fbVars = prt.querySelector('feedbackvariables text')?.textContent || '';
    if (fbVars.includes('all_correct') || fbVars.includes('pt_checks')) {
        part.type = INPUT_TYPES.JSXGRAPH;
        // Strip the helper tail the generator appends on every export —
        // recovering it into gradingCode used to make re-exports append it
        // AGAIN (fv grows once per import/export cycle; F4-prep).
        part.gradingCode = fbVars
            .replace(/\s*\/\* Ensure feedback_msg exists \*\/\s*if not boundp\(feedback_msg\) then feedback_msg: "";\s*$/, '')
            .trim();
    }

    // Power of 10 detection
    if (fbVars.includes('is_p10') || fbVars.includes('p10_ratio')) {
        part.grading.checkPowerOf10 = true;
    }

    // Sign-flip diagnostic detection (A11): sticky so a re-export preserves
    // the imported structure (conversion happens only on re-generation).
    if (part.type === INPUT_TYPES.NUMERICAL || part.type === INPUT_TYPES.UNITS) {
        part.grading.signFlip = fbVars.includes('is_sign_flip');
    }

    // Prerequisite detection (F5: both the real-check and the honest
    // attempted-only comment forms)
    if (fbVars.includes('prereq_passed')) {
        const prereqMatch = fbVars.match(/Prerequisite (?:check: verify|gate:) part \(([a-z])\)/);
        if (prereqMatch) {
            part.prerequisite = prereqMatch[1].charCodeAt(0) - 96;
        }
    }

    // Notes auto-credit detection (PRT uses sans=1, tans=1 and quiet=1)
    const firstNode = prt.querySelector('node');
    if (firstNode) {
        const quiet = firstNode.querySelector('quiet')?.textContent;
        const sans = firstNode.querySelector('sans')?.textContent;
        const tans = firstNode.querySelector('tans')?.textContent;
        if (quiet === '1' && sans === '1' && tans === '1' && type === 'notes') {
            const score = firstNode.querySelector('truescore')?.textContent;
            part.notesAutoCredit = score === '1';
        }
    }

    // Analyze nodes for tolerances and feedback. Tolerance nodes are mapped
    // by ORDER, not by literal node id — prerequisite gate wrapping shifts
    // every id by one, so "node 0 = wide" would misread gated parts.
    const nodes = prt.querySelectorAll('node');
    let tolNodesSeen = 0;
    const tolNodesTotal = Array.from(nodes).filter(
        n => TOLERANCE_TESTS.has(n.querySelector('answertest')?.textContent)).length;
    nodes.forEach(node => {
        const nodeId = node.querySelector('name')?.textContent;
        const testType = node.querySelector('answertest')?.textContent;
        const testOpt = node.querySelector('testoptions')?.textContent;
        const sans = node.querySelector('sans')?.textContent?.trim();

        // Extract custom feedback messages
        const trueFb = node.querySelector('truefeedback text')?.textContent?.trim();
        const falseFb = node.querySelector('falsefeedback text')?.textContent?.trim();

        // Special nodes (recognised by their sans) — recover their feedback
        // and skip the tolerance mapping below.
        if (sans === 'prereq_passed') {
            if (falseFb) part.feedback.prerequisiteNotMet = falseFb;
            return;
        }
        if (sans === 'is_sign_flip') {
            if (trueFb) part.feedback.signFlip = trueFb;
            return;
        }
        if (sans === 'is_p10_error') {
            if (trueFb) part.feedback.powerOf10Error = trueFb;
            return;
        }

        // Single-comparison part types: the main node's feedback pair.
        if ([INPUT_TYPES.ALGEBRAIC, INPUT_TYPES.MATRIX, INPUT_TYPES.STRING,
            INPUT_TYPES.RADIO, INPUT_TYPES.JSXGRAPH].includes(part.type)) {
            const stripJsx = (s) => s.replace(/<br><hr><p>\{@feedback_msg@\}<\/p>$/, '');
            if (trueFb) part.feedback.correct = stripJsx(trueFb);
            if (falseFb) part.feedback.incorrect = stripJsx(falseFb);
        }
        if (part.type === INPUT_TYPES.NOTES && trueFb) {
            part.feedback.notesReceived = trueFb;
        }

        if (part.type === INPUT_TYPES.NUMERICAL || part.type === INPUT_TYPES.UNITS) {
            if (TOLERANCE_TESTS.has(testType)) {
                // A11: preserve the imported file's tolerance semantics
                part.grading.tolType = RELATIVE_TESTS.has(testType) ? 'relative' : 'absolute';
                tolNodesSeen++;
                if (part.type === INPUT_TYPES.UNITS) {
                    // units-prt emits a SINGLE tolerance node (the tight
                    // tolerance) — there is no wide tier for units parts.
                    part.grading.tightTol = parseFloat(testOpt) || 0.05;
                    if (trueFb) part.feedback.correct = trueFb;
                    if (falseFb) part.feedback.wrongUnits = falseFb;
                } else if (tolNodesTotal >= 2 && tolNodesSeen === 1) {
                    // Two-tier pipeline: first tolerance node = wide (50%).
                    part.grading.wideTol = parseFloat(testOpt) || 0.2;
                    if (falseFb) part.feedback.incorrect = falseFb;
                } else {
                    // Tight/full-credit check (second of two, or a single).
                    part.grading.tightTol = parseFloat(testOpt) || 0.05;
                    if (tolNodesTotal === 1) part.grading.wideTol = 0;
                    if (trueFb) part.feedback.correct = trueFb;
                    if (falseFb) {
                        if (tolNodesTotal >= 2) part.feedback.closeButInaccurate = falseFb;
                        else part.feedback.incorrect = falseFb;
                    }
                }
            }
            if (SIGFIGS_TESTS.has(testType)) {
                part.grading.checkSigFigs = true;
                part.grading.sigFigs = parseInt(testOpt) || 3;
                if (falseFb) part.feedback.wrongSigFigs = falseFb;
            }
        }

        // MCQ: recover correct answer. Canonical form (A5-prep): tans is the
        // correct option's VALUE as a Maxima string. Legacy exports carried a
        // 1-based index — heal those on import (X1).
        if (part.type === INPUT_TYPES.RADIO && nodeId === '0') {
            const correctTans = node.querySelector('tans')?.textContent?.trim();
            if (correctTans && part.options.length > 0) {
                const strMatch = correctTans.match(/^"([\s\S]*)"$/);
                if (strMatch) {
                    const val = strMatch[1].replace(/\\"/g, '"');
                    const opt = part.options.find(o => o.value === val);
                    if (opt) opt.correct = true;
                } else {
                    const correctIdx = parseInt(correctTans) - 1;
                    if (correctIdx >= 0 && correctIdx < part.options.length) {
                        part.options[correctIdx].correct = true;
                    }
                }
            }
        }
    });
}

/**
 * Parses STACK radio option list: [[label, true/false], ...]
 */
function parseRadioOptions(value) {
    try {
        let trimmed = value.trim();

        // Strip random_permutation(...) wrapper if present — MCQ variables are now
        // emitted as random_permutation([[label,bool],...]) so options shuffle per variant.
        const permMatch = trimmed.match(/^random_permutation\s*\(\s*([\s\S]*)\s*\)\s*$/);
        if (permMatch) trimmed = permMatch[1].trim();

        if (!trimmed.startsWith('[')) return [];

        const options = [];

        // Match option pairs with an escape-aware label pattern (F6): a
        // label containing \" must not terminate the match early — the same
        // pattern the radio PRT tans recovery uses.
        const pairs = trimmed.match(/\["((?:[^"\\]|\\.)*)",\s*(true|false)\]/g);
        if (!pairs) return [];

        pairs.forEach(pair => {
            const m = pair.match(/\["((?:[^"\\]|\\.)*)",\s*(true|false)\]/);
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
