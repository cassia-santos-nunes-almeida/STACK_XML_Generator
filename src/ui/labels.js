// A7 — the ONE teacher-facing labels map. Plain language in the visible
// label; the technical STACK/Maxima/XML term survives in a tooltip or a
// "(STACK: ...)" suffix so the Moodle/support vocabulary bridge remains.
// Labels-only discipline: this module must never influence state keys,
// XML tags, input names, or answernote formats.
// Static counterparts in index.html are stamped at init by applyStaticLabels()
// so the map stays the single source for those too.

export const LABELS = {
    // Header buttons (index.html)
    previewFileButton: 'Preview File',
    previewFileTooltip: 'Shows the file that will be downloaded (Moodle XML / STACK source)',
    downloadButton: 'Download for Moodle',
    downloadTooltip: 'Creates the question file to import into Moodle (Moodle XML format)',

    // Section 3 heading (index.html)
    variablesHeading: '3. Question Values',
    variablesTooltip: 'Random values and formulas used in the question (STACK: question variables, Maxima syntax)',

    // Preview panel info box (index.html)
    previewInfo: 'The preview shows one set of random values. Download the file and import it into Moodle to try the real grading.',

    // Variables panel (render-variables.js)
    syntaxReference: 'Formula Reference & Examples (STACK: Maxima syntax)',

    // JSXGraph advanced panel (render-parts.js)
    graphGradingLabel: 'Graph Grading Code (advanced)',
    graphGradingTooltip: 'This code runs on the server to grade the student\'s graph answer (STACK: Maxima feedback variables). Must set \'all_correct\' to true/false.',
    graphGradingHelpTerm: 'The grading code',

    // Notifications / window titles (app.js)
    notifyImportedQuestion: 'Question file imported.',
    notifyImportedDraft: 'Draft file loaded.',
    previewWindowTitle: 'Export file preview (Moodle XML)',
};

/**
 * Stamps the static index.html elements with their labels so the map above
 * is the single source of truth for them as well.
 */
export function applyStaticLabels() {
    const set = (id, text, tooltip) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        if (tooltip) el.title = tooltip;
    };
    set('btn-preview-xml', LABELS.previewFileButton, LABELS.previewFileTooltip);
    set('btn-export-xml', LABELS.downloadButton, LABELS.downloadTooltip);
    const heading = document.getElementById('variables-heading');
    if (heading) {
        heading.textContent = LABELS.variablesHeading + ' ';
        const tip = document.createElement('span');
        tip.className = 'tooltip';
        tip.title = LABELS.variablesTooltip;
        tip.textContent = '?';
        heading.appendChild(tip);
    }
    const info = document.getElementById('preview-info-text');
    if (info) info.textContent = LABELS.previewInfo;
}
