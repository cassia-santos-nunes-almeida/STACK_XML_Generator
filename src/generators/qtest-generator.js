// A5 — Question tests (<qtest>) + deployed seeds (P-STACK-61 doctrine).
//
// Schema: synced skill references/stack-xml-conventions.md "Question Tests"
// (verified against real STACK exports): direct children of <qtest> are ONLY
// <testcase>, <description>, <testinput>, <expected>; NOTHING inside <qtest>
// is <text>-wrapped (a wrapped <expectedanswernote> aborts the whole Moodle
// import with a PHP substr() error).
//
// Expected scores/penalties/answernotes are NEVER hardcoded: they are derived
// by WALKING the node graph the PRT generators actually emitted (parsed back
// out of the generated PRT XML, including prerequisite gate wrapping and
// A11's sign-flip / power-of-10 diagnostics). Branch decisions:
//   - model-answer inputs take the TRUE branch by construction (the input IS
//     the teacher answer; sig-figs nodes are true only when the emitted input
//     is wrapped in significantfigures(...));
//   - distractor / implied-multiplication inputs are decided numerically by
//     sampling the question variables through variable-parser (30 rerolls,
//     all samples must agree — anything undecidable drops that qtest rather
//     than emitting a guess).
import { evaluatePreviewValue } from '../parsers/variable-parser.js';
import { resolveToleranceMode, teacherAnswerMayBeZero } from './tolerance-mode.js';
import { radioCorrectValue } from './prts/radio-prt.js';

const DEFAULT_SEEDS = [12345, 10101, 10102];
const SAMPLES = 30;
const GRADEABLE = new Set(['numerical', 'algebraic', 'units', 'matrix', 'string', 'jsxgraph']);

// ---------------------------------------------------------------------------
// Randomisation detection + deployed seeds
// ---------------------------------------------------------------------------

/**
 * True when the question evaluates randomly per attempt — either through
 * rand* question variables or through the random_permutation(...) wrapper
 * the app emits for every radio part's option list.
 */
export function questionIsRandomised(data) {
    const vars = data.variables || [];
    if (vars.some(v => v.type === 'rand' || /\brand(_with_step)?\s*\(/.test(v.value || ''))) {
        return true;
    }
    return (data.parts || []).some(p => p.type === 'radio' && p.options && p.options.length > 0);
}

/**
 * Emits <deployedseed> elements (3 by default, house pattern) when the
 * question is randomised. Imported seed sets are preserved as-is.
 */
export function generateDeployedSeeds(data) {
    if (!data.parts || data.parts.length === 0) return '';
    if (!questionIsRandomised(data)) return '';
    const seeds = (Array.isArray(data.deployedSeeds) && data.deployedSeeds.length > 0)
        ? data.deployedSeeds
        : DEFAULT_SEEDS;
    return seeds.map(s => `
    <deployedseed>${s}</deployedseed>`).join('');
}

// ---------------------------------------------------------------------------
// Test-input construction
// ---------------------------------------------------------------------------

/**
 * The qtest input value representing the model answer for a part.
 * Doctrine form is ev(taN, simp); numerical parts with a sig-figs check are
 * wrapped in significantfigures(taN, n) so the model answer can actually
 * pass its own sig-figs node (a full-precision float never has exactly n
 * significant figures). The wrapper is only used when its rounding error is
 * provably inside the tight tolerance.
 */
export function modelInputValue(part, ctx) {
    switch (part.type) {
        case 'radio':
            return radioCorrectValue(part);
        case 'notes':
            return '"attempt"';
        case 'numerical': {
            const g = part.grading || {};
            if (g.checkSigFigs && g.sigFigs > 0 && sigFigsWrapperSafe(part, ctx)) {
                return `significantfigures(${part.teacherAnswer}, ${g.sigFigs})`;
            }
            return `ev(${part.teacherAnswer}, simp)`;
        }
        default:
            return `ev(${part.teacherAnswer}, simp)`;
    }
}

/** True when rounding ta to n sig figs provably stays inside the tight tolerance. */
function sigFigsWrapperSafe(part, ctx) {
    const g = part.grading || {};
    const n = g.sigFigs;
    const { useRelative } = resolveToleranceMode(part, ctx);
    if (useRelative) {
        // Max relative rounding error at n sig figs is 0.5 * 10^(1-n).
        return 0.5 * Math.pow(10, 1 - n) < (g.tightTol || 0);
    }
    // Absolute tolerance: sample |sf(ta,n) - ta| across the rand space.
    const vars = ctx?.variables || [];
    const taName = part.teacherAnswer;
    if (!taName || teacherAnswerMayBeZero(taName, vars)) return false;
    for (let i = 0; i < SAMPLES; i++) {
        const sample = buildSample(vars, {});
        const ta = sample[taName];
        if (typeof ta !== 'number') return false;
        const rounded = parseFloat(ta.toPrecision(n));
        if (Math.abs(rounded - ta) >= (g.tightTol || 0)) return false;
    }
    return true;
}

/**
 * The wrong-answer (distractor) input for a part, or null.
 * Template-curated part.distractor wins; otherwise a structurally-different
 * auto distractor is derived where it is provably sound:
 *   - numerical: sign-flipped teacher answer (the house Rule-3 diagnostic)
 *   - radio: the first incorrect option's value
 * Types with no sensible generic distractor get none (per the A5 rider).
 */
export function effectiveDistractor(part, ctx) {
    if (part.distractor && String(part.distractor).trim()) {
        return String(part.distractor).trim();
    }
    if (part.type === 'radio') {
        const wrong = (part.options || []).find(o => !o.correct);
        return wrong ? `"${String(wrong.value).replace(/"/g, '\\"')}"` : null;
    }
    if (part.type === 'numerical') {
        // Sound only when ta is provably nonzero-numeric across the rand
        // space (otherwise -ta may fall inside tolerance).
        if (!teacherAnswerMayBeZero(part.teacherAnswer, ctx?.variables || [])) {
            return `ev(-(${part.teacherAnswer}), simp)`;
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Numeric sampling machinery
// ---------------------------------------------------------------------------

// Identifiers that must never be treated as free symbols (functions/constants
// — assigning them numbers could turn an unevaluable expression into a bogus
// numeric result instead of a clean "undecidable").
const KNOWN_FUNCS = new Set([
    'sin', 'cos', 'tan', 'exp', 'sqrt', 'log', 'abs', 'pi', 'e', 'ev', 'simp',
    'expand', 'significantfigures', 'decimalplaces', 'stackunits', 'Math',
    'matrix', 'determinant', 'transpose', 'invert', 'integrate', 'diff',
    'rand', 'rand_with_step', 'random_permutation', 'makelist', 'length',
    'floor', 'ceiling', 'round', 'if', 'then', 'else', 'is', 'and', 'or', 'not',
    'true', 'false', 'block', 'for', 'thru', 'do', 'apply', 'sconcat', 'string',
]);

/** Strips Maxima wrappers that are numeric identities. */
function stripWrappers(expr) {
    let e = String(expr).trim().replace(/;+$/, '');
    e = e.replace(/\bev\s*\(([\s\S]*?),\s*simp\s*\)/g, '($1)');
    e = e.replace(/\bexpand\s*\(/g, '(');
    // Peel redundant outer parentheses so bare-identifier / stackunits
    // forms are still recognised after ev() unwrapping.
    while (/^\([\s\S]*\)$/.test(e) && balancedInner(e)) {
        e = e.slice(1, -1).trim();
    }
    return e;
}

/** True when the outermost parentheses of "(...)" belong together. */
function balancedInner(e) {
    let depth = 0;
    for (let i = 0; i < e.length; i++) {
        if (e[i] === '(') depth++;
        else if (e[i] === ')') { depth--; if (depth === 0) return i === e.length - 1; }
    }
    return false;
}

/** Parses a top-level stackunits(num, unit) form. */
function parseStackunits(expr) {
    const m = String(expr).trim().match(/^stackunits\s*\(([\s\S]+),\s*([^,()]+)\)\s*;?$/);
    if (!m) return null;
    return { numExpr: m[1], unit: m[2].trim() };
}

/**
 * Evaluates one full set of question-variable sample values (in definition
 * order). Free symbols get shared random values from freeSyms. Unevaluable
 * variables are set to null.
 */
function buildSample(vars, freeSyms) {
    const ctx = {};
    for (const v of vars || []) {
        ctx[v.name] = evalNumeric(v.value, v.type === 'rand' ? 'rand' : 'calc', ctx, freeSyms, vars);
    }
    return ctx;
}

/**
 * Numerically evaluates a Maxima expression against sampled variable values,
 * assigning shared random values to any residual free symbols (e.g. the x in
 * an algebraic answer). Returns a number, a {num, unit} object for
 * stackunits forms, a string for quoted string literals, or null.
 */
function evalNumeric(expr, type, ctx, freeSyms, vars) {
    if (expr === null || expr === undefined) return null;
    let e = stripWrappers(expr);

    const strMatch = e.match(/^"([\s\S]*)"$/);
    if (strMatch) return strMatch[1].replace(/\\"/g, '"');

    const su = parseStackunits(e);
    if (su) {
        const num = evalNumeric(su.numExpr, 'calc', ctx, freeSyms, vars);
        return typeof num === 'number' ? { num, unit: su.unit } : null;
    }

    // Bare identifier that names a stackunits-valued variable
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(e) && vars) {
        const def = (vars || []).find(v => v.name === e);
        if (def && parseStackunits(stripWrappers(def.value || ''))) {
            const inner = parseStackunits(stripWrappers(def.value));
            const num = evalNumeric(inner.numExpr, 'calc', ctx, freeSyms, vars);
            return typeof num === 'number' ? { num, unit: inner.unit } : null;
        }
        if (typeof ctx[e] === 'object' && ctx[e] !== null) return ctx[e];
    }

    // significantfigures(x, n) — emulate with toPrecision
    const sfMatch = e.match(/^significantfigures\s*\(([\s\S]+),\s*(\d+)\s*\)$/);
    if (sfMatch) {
        const inner = evalNumeric(sfMatch[1], 'calc', ctx, freeSyms, vars);
        return typeof inner === 'number' ? parseFloat(inner.toPrecision(parseInt(sfMatch[2]))) : null;
    }

    const numericCtx = {};
    for (const [k, v] of Object.entries(ctx)) {
        if (typeof v === 'number' && Number.isFinite(v)) numericCtx[k] = v;
    }

    let val = evaluatePreviewValue(type, e, numericCtx);
    if (typeof val === 'number' && Number.isFinite(val)) return val;

    // Residual free symbols: give them shared random nonzero values.
    const ids = [...new Set((e.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []))]
        .filter(id => !KNOWN_FUNCS.has(id) && numericCtx[id] === undefined && !/^\d/.test(id));
    if (ids.length === 0) return null;
    for (const id of ids) {
        if (freeSyms[id] === undefined) freeSyms[id] = 0.7 + Math.random() * 1.6;
    }
    val = evaluatePreviewValue(type, e, { ...numericCtx, ...freeSyms });
    return (typeof val === 'number' && Number.isFinite(val)) ? val : null;
}

// ---------------------------------------------------------------------------
// PRT graph parsing (from the emitted XML — the walk sees exactly what the
// importer will see, including prerequisite gate wrapping)
// ---------------------------------------------------------------------------

function decodeEntities(s) {
    return String(s)
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export function parsePrtGraph(prtXml) {
    const fvMatch = prtXml.match(/<feedbackvariables>\s*<text><!\[CDATA\[([\s\S]*?)\]\]><\/text>\s*<\/feedbackvariables>/);
    const fv = fvMatch ? fvMatch[1] : '';
    const nodes = new Map();
    for (const m of prtXml.matchAll(/<node>([\s\S]*?)<\/node>/g)) {
        const b = m[1];
        const g = (tag) => {
            const mm = b.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
            return mm ? mm[1].trim() : '';
        };
        const node = {
            id: g('name'),
            answertest: g('answertest'),
            sans: decodeEntities(g('sans')),
            tans: decodeEntities(g('tans')),
            testoptions: decodeEntities(g('testoptions')),
            t: { mode: g('truescoremode'), score: parseFloat(g('truescore')), penalty: g('truepenalty'), next: g('truenextnode'), note: g('trueanswernote') },
            f: { mode: g('falsescoremode'), score: parseFloat(g('falsescore')), penalty: g('falsepenalty'), next: g('falsenextnode'), note: g('falseanswernote') },
        };
        nodes.set(node.id, node);
    }
    return { fv, nodes };
}

/**
 * Walks a parsed PRT graph. decide(node) returns true/false/null.
 * Returns { score, penalty, note } or null when any decision is undecidable.
 */
export function walkPrt(graph, decide) {
    let score = 0;
    let cur = '0';
    let last = null;
    const visited = new Set();
    while (cur !== '-1') {
        const node = graph.nodes.get(cur);
        if (!node || visited.has(cur)) return null;
        visited.add(cur);
        const outcome = decide(node);
        if (outcome === null || outcome === undefined) return null;
        const branch = outcome ? node.t : node.f;
        if (branch.mode === '=') score = branch.score;
        else if (branch.mode === '+') score += branch.score;
        else if (branch.mode === '-') score -= branch.score;
        last = branch;
        cur = branch.next;
    }
    if (!last) return null;
    score = Math.max(0, Math.min(1, score));
    return { score, penalty: last.penalty, note: last.note };
}

// ---------------------------------------------------------------------------
// Branch decisions
// ---------------------------------------------------------------------------

const REL_TESTS = new Set(['NumRelative', 'UnitsRelative', 'UnitsStrictRelative']);
const ABS_TESTS = new Set(['NumAbsolute', 'UnitsAbsolute', 'UnitsStrictAbsolute']);

/**
 * Extracts the diagnostic/prerequisite formulas from the feedbackvariables
 * the PRT generators emit. Pattern-matched against the emitted shapes —
 * if the fv shape changes, extraction fails and the walk turns undecidable
 * (dropping the qtest) rather than guessing.
 */
function parseFvDiagnostics(fv) {
    const out = {};
    let m = fv.match(/sf_safe_tans:\s*if is\(([A-Za-z_][A-Za-z0-9_]*)\s*=\s*0\)[^;]*;\s*\n?\s*sf_ratio:\s*([A-Za-z_][A-Za-z0-9_]*)\s*\//);
    if (m) out.signFlip = { ta: m[1], input: m[2] };
    m = fv.match(/p10_safe_tans:\s*if is\(([A-Za-z_][A-Za-z0-9_]*)\s*=\s*0\)[^;]*;\s*\n?\s*p10_ratio:\s*([A-Za-z_][A-Za-z0-9_]*)\s*\//);
    if (m) out.p10 = { ta: m[1], input: m[2] };
    m = fv.match(/prereq_diff:\s*abs\(([A-Za-z_][A-Za-z0-9_]*)\s*-\s*([A-Za-z_][A-Za-z0-9_]*)\);\s*\n?\s*prereq_passed:\s*is\(prereq_diff\s*(<=?)\s*([0-9.]+)\s*(\*\s*abs\(([A-Za-z_][A-Za-z0-9_]*)\))?\)/);
    if (m) {
        out.prereq = { input: m[1], ta: m[2], op: m[3], tol: parseFloat(m[4]), relative: !!m[5] };
        return out;
    }
    // F5 equality gates: case-folded string compare, then plain equality.
    m = fv.match(/prereq_passed:\s*is\(sdowncase\(([A-Za-z_][A-Za-z0-9_]*)\)\s*=\s*sdowncase\(([A-Za-z_][A-Za-z0-9_]*)\)\)/);
    if (m) {
        out.prereq = { input: m[1], taExpr: m[2], equality: true, fold: true };
        return out;
    }
    m = fv.match(/prereq_passed:\s*is\(([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("(?:[^"\\]|\\.)*"|[A-Za-z_][A-Za-z0-9_]*)\)/);
    if (m) {
        // is(ansN = ansN) is the attempted-only gate — trivially true once
        // the input is present (a qtest always provides every input).
        out.prereq = m[2] === m[1] ? { trivial: true } : { input: m[1], taExpr: m[2], equality: true };
        return out;
    }
    if (/prereq_passed:\s*true/.test(fv)) {
        out.prereq = { trivial: true };
    }
    return out;
}

function asComparable(v) {
    if (typeof v === 'number') return { num: v, unit: null };
    if (v && typeof v === 'object' && typeof v.num === 'number') return { num: v.num, unit: v.unit };
    return null;
}

/** Decides a single answertest outcome from sampled values. */
function decideTestSample(node, sansVal, tansVal) {
    const test = node.answertest;
    if (REL_TESTS.has(test) || ABS_TESTS.has(test)) {
        const s = asComparable(sansVal);
        const t = asComparable(tansVal);
        if (!s || !t) return null;
        if (test.startsWith('Units')) {
            if ((s.unit || null) !== (t.unit || null)) return false;
        }
        const tol = parseFloat(node.testoptions);
        if (!Number.isFinite(tol)) return null;
        const diff = Math.abs(s.num - t.num);
        return REL_TESTS.has(test) ? diff <= tol * Math.abs(t.num) : diff <= tol;
    }
    if (test === 'AlgEquiv' || test === 'CasEqual') {
        if (typeof sansVal === 'boolean' && (node.tans === 'true' || node.tans === 'false')) {
            return sansVal === (node.tans === 'true');
        }
        if (typeof sansVal === 'string' && typeof tansVal === 'string') return sansVal === tansVal;
        const s = asComparable(sansVal);
        const t = asComparable(tansVal);
        if (!s || !t || (s.unit || null) !== (t.unit || null)) return null;
        const scale = Math.max(1, Math.abs(t.num));
        if (Math.abs(s.num - t.num) < 1e-9 * scale) return true;
        if (Math.abs(s.num - t.num) > 1e-6 * scale) return false;
        return null; // too close to call — treat as undecidable
    }
    if (test === 'String') {
        return (typeof sansVal === 'string' && typeof tansVal === 'string') ? sansVal === tansVal : null;
    }
    if (test === 'StringSloppy') {
        return (typeof sansVal === 'string' && typeof tansVal === 'string')
            ? sansVal.trim().toLowerCase() === tansVal.trim().toLowerCase() : null;
    }
    return null; // NumSigFigs & friends: only decidable on the model path
}

// ---------------------------------------------------------------------------
// Qtest assembly
// ---------------------------------------------------------------------------

function formatScore(x) {
    return x.toFixed(7);
}

function expectedElement(prtName, result) {
    const penalty = result.penalty === ''
        ? '<expectedpenalty/>'
        : `<expectedpenalty>${formatScore(parseFloat(result.penalty))}</expectedpenalty>`;
    return `
      <expected>
        <name>${prtName}</name>
        <expectedscore>${formatScore(result.score)}</expectedscore>
        ${penalty}
        <expectedanswernote>${result.note}</expectedanswernote>
      </expected>`;
}

/**
 * Builds all <qtest> blocks for a question.
 *
 * @param {object} data - Full question data
 * @param {Array<{part, prtName, xml}>} prtBlocks - The emitted PRT XML per part
 * @returns {string} XML for every derivable qtest ('' when none)
 */
export function generateQuestionTests(data, prtBlocks) {
    const parts = (data.parts || []);
    if (parts.length === 0 || prtBlocks.length === 0) return '';
    const vars = data.variables || [];
    const ctx = { variables: vars };

    // Scenario table: input expression per part + whether it is the model.
    const scenarios = [];
    const modelValues = {};
    parts.forEach(p => { modelValues[p.id] = modelInputValue(p, ctx); });

    scenarios.push({
        description: 'Model answer earns full marks.',
        values: parts.map(p => ({ part: p, expr: modelValues[p.id], isModel: true })),
    });

    const distractors = parts.map(p => ({ part: p, expr: effectiveDistractor(p, ctx) }));
    if (distractors.some(d => d.expr)) {
        scenarios.push({
            description: 'Wrong answer lands on the diagnosed branch.',
            values: parts.map(p => {
                const d = distractors.find(x => x.part === p);
                return d.expr
                    ? { part: p, expr: d.expr, isModel: false }
                    : { part: p, expr: modelValues[p.id], isModel: true };
            }),
        });
    }

    if (parts.some(p => p.type === 'algebraic')) {
        // D4 pin: insertstars=1 must keep accepting implied multiplication.
        scenarios.push({
            description: 'Implied multiplication (2x) is accepted and graded (insertstars=1).',
            values: parts.map(p => (p.type === 'algebraic'
                ? { part: p, expr: '2x', evalExpr: '2*x', isModel: false }
                : { part: p, expr: modelValues[p.id], isModel: true })),
        });
    }

    const graphs = prtBlocks.map(b => ({ ...b, graph: parsePrtGraph(b.xml), diag: null }));
    graphs.forEach(g => { g.diag = parseFvDiagnostics(g.graph.fv); });

    let testcase = 1;
    let xml = '';

    for (const scenario of scenarios) {
        const valueByInput = {};
        scenario.values.forEach(v => { valueByInput[v.part.answer] = v; });

        // Sampled numeric values for every scenario input, shared free symbols.
        const samples = [];
        let samplingBroken = false;
        for (let i = 0; i < SAMPLES; i++) {
            const freeSyms = {};
            const varCtx = buildSample(vars, freeSyms);
            const inputVals = {};
            for (const v of scenario.values) {
                inputVals[v.part.answer] = evalNumeric(v.evalExpr || v.expr, 'calc', varCtx, freeSyms, vars);
            }
            samples.push({ varCtx, inputVals, freeSyms });
        }

        const expectations = [];
        for (const g of graphs) {
            const scenarioVal = valueByInput[g.part.answer];
            const decide = (node) => {
                // Prerequisite gate — depends on ANOTHER part's scenario value.
                if (node.sans === 'prereq_passed') {
                    const pre = g.diag.prereq;
                    if (!pre) return null;
                    if (pre.trivial) return true;
                    const preScenario = valueByInput[pre.input];
                    if (preScenario && preScenario.isModel) return true;
                    if (pre.equality) {
                        // F5: radio/string equality gates.
                        return decideAllSamples(samples, (s) => {
                            const v = s.inputVals[pre.input];
                            const ta = evalNumeric(pre.taExpr, 'calc', s.varCtx, s.freeSyms, vars);
                            if (typeof v === 'string' && typeof ta === 'string') {
                                return pre.fold
                                    ? v.trim().toLowerCase() === ta.trim().toLowerCase()
                                    : v === ta;
                            }
                            const sv = asComparable(v);
                            const tv = asComparable(ta);
                            if (!sv || !tv || (sv.unit || null) !== (tv.unit || null)) return null;
                            const scale = Math.max(1, Math.abs(tv.num));
                            if (Math.abs(sv.num - tv.num) < 1e-9 * scale) return true;
                            if (Math.abs(sv.num - tv.num) > 1e-6 * scale) return false;
                            return null;
                        });
                    }
                    return decideAllSamples(samples, (s) => {
                        const v = asComparable(s.inputVals[pre.input]);
                        const ta = asComparable(evalNumeric(pre.ta, 'calc', s.varCtx, s.freeSyms, vars));
                        if (!v || !ta) return null;
                        const diff = Math.abs(v.num - ta.num);
                        const bound = pre.relative ? pre.tol * Math.abs(ta.num) : pre.tol;
                        return pre.op === '<=' ? diff <= bound : diff < bound;
                    });
                }
                // Diagnostic fv booleans (sign-flip / power-of-10).
                if (node.sans === 'is_sign_flip' || node.sans === 'is_p10_error') {
                    const d = node.sans === 'is_sign_flip' ? g.diag.signFlip : g.diag.p10;
                    if (!d) return null;
                    const dScenario = valueByInput[d.input];
                    if (dScenario && dScenario.isModel) {
                        // Model path never reaches diagnostics, but be safe.
                        return node.sans === 'is_sign_flip' ? false : false;
                    }
                    return decideAllSamples(samples, (s) => {
                        const v = asComparable(s.inputVals[d.input]);
                        const ta = asComparable(evalNumeric(d.ta, 'calc', s.varCtx, s.freeSyms, vars));
                        if (!v || !ta) return null;
                        const safeTa = ta.num === 0 ? 1 : ta.num;
                        const ratio = v.num / safeTa;
                        if (node.sans === 'is_sign_flip') return Math.abs(ratio + 1) < 0.05;
                        return Math.abs(ratio - 10) < 1 || Math.abs(ratio - 0.1) < 0.01;
                    });
                }
                // Ordinary node comparing this part's input.
                if (!scenarioVal || scenarioVal.isModel) {
                    // Model contract: the input IS the teacher answer, so every
                    // comparison node on the model path is true — except a
                    // sig-figs node when the input could not be safely wrapped.
                    if (node.answertest === 'NumSigFigs') {
                        return String(scenarioVal ? scenarioVal.expr : '').startsWith('significantfigures(');
                    }
                    return true;
                }
                return decideAllSamples(samples, (s) => {
                    const sv = s.inputVals[g.part.answer];
                    const tv = evalNumeric(node.tans, 'calc', s.varCtx, s.freeSyms, vars);
                    return decideTestSample(node, sv, tv);
                });
            };

            const result = walkPrt(g.graph, decide);
            if (!result) { expectations.length = 0; break; }
            expectations.push({ prtName: g.prtName, result });
        }

        if (expectations.length !== graphs.length) continue; // undecidable — drop scenario

        const inputs = scenario.values.map(v => `
      <testinput>
        <name>${v.part.answer}</name>
        <value>${escapePlain(v.expr)}</value>
      </testinput>`).join('');

        xml += `
    <qtest>
      <testcase>${testcase}</testcase>
      <description>${escapePlain(scenario.description)}</description>${inputs}${expectations.map(e => expectedElement(e.prtName, e.result)).join('')}
    </qtest>`;
        testcase++;
    }

    return xml;
}

/** All samples must agree; any null or disagreement is undecidable. */
function decideAllSamples(samples, fn) {
    let first = null;
    for (const s of samples) {
        const v = fn(s);
        if (v === null || v === undefined) return null;
        if (first === null) first = v;
        else if (v !== first) return null;
    }
    return first;
}

/** Escapes plain-text (non-CDATA) element content. */
function escapePlain(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
