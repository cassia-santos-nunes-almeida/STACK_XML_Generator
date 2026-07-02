// Stop-slop linter — flags AI-tell patterns in student-facing prose (P-WRITE-01).
//
// Pattern source: my-claude-skills/personal/stop-slop/references/banned-phrases.md (Tier 1).
// Only student-facing text fields are checked: questionText, generalFeedback, hints,
// per-part text, per-part feedback messages. Code fields (Maxima, JSXGraph, PRT logic)
// are not prose and are skipped.

/**
 * Tier-1 AI-tell patterns. Each entry: regex (case-insensitive, word-bound where
 * appropriate) + plain-English replacement suggestion. Grouped by kind for readability.
 */
const PATTERNS = [
    // Single-word replacements — always flag
    { pattern: /\bcrucial(ly)?\b/gi, suggest: 'important, key, necessary' },
    { pattern: /\bvital(ly)?\b/gi, suggest: 'important, essential' },
    { pattern: /\butiliz(e|es|ed|ing)\b/gi, suggest: 'use' },
    { pattern: /\bholistic(ally)?\b/gi, suggest: 'complete, full, whole' },
    { pattern: /\brealm\b/gi, suggest: 'area, field, domain' },
    { pattern: /\bparadigm\b/gi, suggest: 'model, approach, framework' },
    { pattern: /\bmeticulous(ly)?\b/gi, suggest: 'careful, detailed, precise' },
    { pattern: /\bseamless(ly)?\b/gi, suggest: 'smooth, easy' },
    { pattern: /\bembark(s|ed|ing)?\b/gi, suggest: 'start, begin' },
    { pattern: /\btestament\b/gi, suggest: 'shows, proves, demonstrates' },
    { pattern: /\brobust(ly)?\b/gi, suggest: 'strong, reliable, solid' },
    { pattern: /\bcomprehensive(ly)?\b/gi, suggest: 'thorough, complete, full' },
    { pattern: /\bcutting[-\s]edge\b/gi, suggest: 'latest, newest, advanced' },
    { pattern: /\bpivotal(ly)?\b/gi, suggest: 'important, key' },
    { pattern: /\bunderscor(e|es|ed|ing)\b/gi, suggest: 'highlights, shows' },
    { pattern: /\btapestry\b/gi, suggest: '(describe the actual complexity instead)' },
    { pattern: /\bsynerg(y|ies|istic)\b/gi, suggest: '(describe the combined effect instead)' },
    { pattern: /\binterplay\b/gi, suggest: 'interaction, relationship' },
    { pattern: /\bcommenc(e|es|ed|ing)\b/gi, suggest: 'start, begin' },
    { pattern: /\bascertain(s|ed|ing)?\b/gi, suggest: 'find out, determine' },
    { pattern: /\bendeavor(s|ed|ing)?\b/gi, suggest: 'effort, attempt, try' },
    { pattern: /\bboast(s|ed|ing)?\b/gi, suggest: 'has, includes' },
    { pattern: /\bdelv(e|es|ed|ing)\b/gi, suggest: '(cut; state the point directly)' },
    { pattern: /\bleverag(e|es|ed|ing)\b/gi, suggest: 'use, take advantage of' },
    { pattern: /\bfoster(s|ed|ing)?\b/gi, suggest: 'encourage, support, build' },
    { pattern: /\bempower(s|ed|ing)?\b/gi, suggest: 'enable, let, allow' },
    { pattern: /\bmyriad\b/gi, suggest: 'many, numerous' },
    { pattern: /\bplethora\b/gi, suggest: 'many, a lot of' },
    { pattern: /\bnavigat(e|es|ed|ing)\b/gi, suggest: 'handle, work through' },
    { pattern: /\bgroundbreaking\b/gi, suggest: 'significant, new' },
    { pattern: /\bimpactful\b/gi, suggest: 'effective, significant' },
    { pattern: /\bshowcas(e|es|ed|ing)\b/gi, suggest: 'show, demonstrate' },
    { pattern: /\bactionable\b/gi, suggest: 'practical, useful, concrete' },
    { pattern: /\bin\s+order\s+to\b/gi, suggest: 'to' },
    { pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi, suggest: 'because' },

    // Throat-clearing / filler phrases
    { pattern: /\bit['\u2019]?s\s+worth\s+noting\b/gi, suggest: '(cut; state the point directly)' },
    { pattern: /\bit\s+is\s+important\s+to\s+note\b/gi, suggest: '(cut; state the point directly)' },
    { pattern: /\bat\s+the\s+end\s+of\s+the\s+day\b/gi, suggest: '(cut; state the conclusion directly)' },
    { pattern: /\blet\s+me\s+be\s+clear\b/gi, suggest: '(cut)' },
    { pattern: /\bthe\s+truth\s+is\b/gi, suggest: '(cut; state the fact)' },
    { pattern: /\bhere['\u2019]?s\s+the\s+thing\b/gi, suggest: '(cut; state the point)' },
    { pattern: /\bwhen\s+it\s+comes\s+to\b/gi, suggest: '(just talk about the thing directly)' },
    { pattern: /\bthat\s+being\s+said\b/gi, suggest: '(cut or use "but")' },
    { pattern: /\bmoving\s+forward\b/gi, suggest: 'next, from now on' },
    { pattern: /\bin\s+conclusion\b/gi, suggest: '(cut; the conclusion should be obvious)' },
    { pattern: /\bin\s+summary\b/gi, suggest: '(cut)' },
    { pattern: /\bto\s+summarize\b/gi, suggest: '(cut)' },

    // Chatbot artifacts
    { pattern: /\bI\s+hope\s+this\s+helps\b/gi, suggest: '(cut)' },
    { pattern: /\bcertainly!/gi, suggest: '(cut; answer directly)' },
    { pattern: /\babsolutely!/gi, suggest: '(cut; answer directly)' },
    { pattern: /\bgreat\s+question!/gi, suggest: '(cut; answer directly)' },
    { pattern: /\bexcellent\s+point!/gi, suggest: '(cut; respond substantively)' },
    { pattern: /\blet['\u2019]?s\s+dive\s+in\b/gi, suggest: '(cut; start the content)' },
    { pattern: /\bdeep\s+dive\b/gi, suggest: 'analysis, examination' },
    { pattern: /\bgame[-\s]changer\b/gi, suggest: 'significant, important' },

    // Confidence-calibration adverbs — flag each, let author decide
    { pattern: /\binterestingly\b/gi, suggest: '(cut; let the fact speak)' },
    { pattern: /\bsurprisingly\b/gi, suggest: '(cut; let the fact speak)' },
    { pattern: /\bnotably\b/gi, suggest: '(cut; let the fact speak)' },
    { pattern: /\bimportantly\b/gi, suggest: '(cut; let the fact speak)' },
];

/**
 * Collects the prose fields from a question data object. Each entry has a label
 * (for reporting) and the text to lint.
 */
function collectProseFields(data) {
    const fields = [];
    if (data.questionText && data.questionText.trim()) {
        fields.push({ field: 'Question text', text: data.questionText });
    }
    if (data.generalFeedback && data.generalFeedback.trim()) {
        fields.push({ field: 'General feedback', text: data.generalFeedback });
    }
    (data.hints || []).forEach((h, i) => {
        if (h && h.trim()) fields.push({ field: `Hint ${i + 1}`, text: h });
    });
    (data.parts || []).forEach((p, i) => {
        const label = String.fromCharCode(97 + i);
        if (p.text && p.text.trim()) {
            fields.push({ field: `Part (${label}) text`, text: p.text });
        }
        const fb = p.feedback || {};
        for (const [key, val] of Object.entries(fb)) {
            if (val && typeof val === 'string' && val.trim()) {
                fields.push({ field: `Part (${label}) feedback: ${key}`, text: val });
            }
        }
    });
    return fields;
}

/**
 * Lints prose fields in a question data object against Tier-1 AI-tell patterns.
 * Returns an array of findings, each naming the field, the matches found, and
 * a replacement suggestion.
 *
 * @param {object} data - Question data object
 * @returns {Array<{field: string, matches: string[], suggest: string}>}
 */
export function lintStopSlop(data) {
    if (!data) return [];
    const findings = [];
    const fields = collectProseFields(data);

    for (const { field, text } of fields) {
        for (const { pattern, suggest } of PATTERNS) {
            const hits = text.match(pattern);
            if (!hits || hits.length === 0) continue;
            const unique = [...new Set(hits.map(h => h.toLowerCase()))];
            findings.push({ field, matches: unique, suggest });
        }
    }
    return findings;
}
