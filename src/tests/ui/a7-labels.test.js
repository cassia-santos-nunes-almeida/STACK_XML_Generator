// A7 — hide-the-CAS label sweep. Labels-only discipline: the map must not
// leak into state keys, XML tags, or answernotes (roundtrip suites pin
// those); here we pin the teacher-visible surfaces.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LABELS } from '../../ui/labels.js';

const here = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(join(here, '..', '..', 'index.html'), 'utf8');

describe('A7: index.html teacher-visible copy', () => {
    it('no raw "Preview XML" / "Download Moodle XML" buttons', () => {
        expect(indexHtml).not.toContain('Preview XML');
        expect(indexHtml).not.toContain('Download Moodle XML');
        expect(indexHtml).toContain('Download for Moodle');
    });

    it('the variables section heading is plain language', () => {
        expect(indexHtml).not.toContain('Variables (Maxima)');
        expect(indexHtml).toContain('id="variables-heading"');
    });

    it('ships a favicon (no 404 console error in the walkthrough)', () => {
        expect(indexHtml).toContain('rel="icon"');
    });
});

describe('A7: labels map keeps the technical bridge', () => {
    it('every relabeled term keeps STACK/Maxima/XML in a tooltip or suffix', () => {
        expect(LABELS.variablesTooltip).toMatch(/STACK|Maxima/);
        expect(LABELS.syntaxReference).toMatch(/Maxima/);
        expect(LABELS.graphGradingTooltip).toMatch(/Maxima/);
        expect(LABELS.previewFileTooltip).toMatch(/XML|STACK/);
        expect(LABELS.downloadTooltip).toMatch(/XML/);
    });

    it('visible labels themselves avoid Maxima jargon', () => {
        [LABELS.variablesHeading, LABELS.downloadButton, LABELS.previewFileButton,
            LABELS.graphGradingLabel, LABELS.notifyImportedQuestion, LABELS.notifyImportedDraft]
            .forEach(l => expect(l).not.toMatch(/Maxima/));
    });
});
