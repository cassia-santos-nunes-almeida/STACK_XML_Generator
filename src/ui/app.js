// Application initialization and event handler setup
import StateManager from '../core/state.js';
import UIManager from './ui-manager.js';
import { generateStackXML } from '../generators/xml-generator.js';
import { TEMPLATES } from '../templates/index.js';
import { validateQuestionData } from '../core/validators.js';
import { escapeHtml } from './escape-utils.js';
import { LABELS, applyStaticLabels } from './labels.js';

function initApp() {
    const state = new StateManager();
    const ui = new UIManager(state);

    // A7: teacher-facing labels come from the single labels map.
    applyStaticLabels();

    // Subscribe UI to state changes
    state.subscribe((data, previewValues) => {
        ui.render(data, previewValues);
    });

    // Initialize UI
    ui.init();

    // Populate template dropdown
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
        Object.entries(TEMPLATES).forEach(([key, tpl]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = tpl.name;
            templateSelect.appendChild(opt);
        });
    }

    // --- Event Handlers ---

    // Add variable
    document.getElementById('btn-add-var')?.addEventListener('click', () => {
        state.addVariable();
    });

    // Auto-detect variables
    document.getElementById('btn-detect-vars')?.addEventListener('click', () => {
        const count = state.scanVariables();
        const msg = count > 0
            ? `Found and added ${count} new variable(s).`
            : 'No new variables found. All {@var@} references are already defined.';
        showNotification(msg, count > 0 ? 'success' : 'info');
    });

    // Add part
    document.getElementById('btn-add-part')?.addEventListener('click', () => {
        state.addPart();
    });

    // Generate sample values
    document.getElementById('btn-gen-sample')?.addEventListener('click', () => {
        state.generateSampleValues();
    });

    // Load template on select change
    if (templateSelect) {
        templateSelect.addEventListener('change', () => {
            const key = templateSelect.value;
            if (key && TEMPLATES[key]) {
                state.loadTemplate(TEMPLATES[key]);
                templateSelect.value = '';
                showNotification('Template loaded.', 'success');
            }
        });
    }

    // Load template button (optional)
    const btnLoadTemplate = document.getElementById('btn-load-template');
    if (btnLoadTemplate && templateSelect) {
        btnLoadTemplate.addEventListener('click', () => {
            const key = templateSelect.value;
            if (key && TEMPLATES[key]) {
                state.loadTemplate(TEMPLATES[key]);
                templateSelect.value = '';
                showNotification('Template loaded.', 'success');
            }
        });
    }

    // Save JSON
    document.getElementById('btn-save')?.addEventListener('click', () => {
        const json = JSON.stringify(state.data, null, 2);
        downloadFile(json, (state.data.name || 'question') + '.json', 'application/json');
    });

    // Load file (JSON or XML)
    document.getElementById('file-upload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const content = ev.target.result;
                let notices = [];
                if (file.name.endsWith('.xml')) {
                    notices = state.loadFromXml(content) || [];
                    showNotification(LABELS.notifyImportedQuestion, 'success');
                } else {
                    notices = state.loadFromJson(content) || [];
                    showNotification(LABELS.notifyImportedDraft, 'success');
                }
                // A2: legacy-migration notices (plain language, blocking read)
                if (notices.length > 0) {
                    alert('This file was updated during import:\n\n' + notices.map(n => '- ' + n).join('\n'));
                }
            } catch (err) {
                showNotification('Error: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Export XML
    document.getElementById('btn-export-xml')?.addEventListener('click', async () => {
        // Test-gate: in dev, confirm export when tests haven't passed (P-TEST-01)
        const testStatus = await checkTestStatus();
        if (!testStatus.ok) {
            const msg =
                testStatus.reason === 'not-run'
                    ? 'Tests have not run yet this session. Run `npm run test` before exporting.\n\nExport anyway?'
                    : testStatus.reason === 'fail'
                    ? `${testStatus.failed} test(s) failing as of ${testStatus.timestamp}.\n\nExport anyway?`
                    : 'Could not verify test status (reading /test-status.json failed).\n\nExport anyway?';
            if (!confirm(msg)) return;
        }

        // Validate first (A6 blocking gate — plain language + stable codes).
        const issues = validateQuestionData(state.data);
        const errors = issues.filter(i => i.level === 'error');
        const fmt = i => `- [${i.code}] ${i.message}`;

        if (errors.length > 0) {
            // Hidden owner-only override (never a teacher-visible button):
            // append ?allow-invalid-export to the URL.
            const ownerOverride = new URLSearchParams(window.location.search).has('allow-invalid-export');
            if (!ownerOverride) {
                const errorMsg = 'This file cannot be downloaded yet — fix these first:\n\n' +
                    errors.map(fmt).join('\n');
                showNotification(errorMsg, 'error');
                return;
            }
            if (!confirm('OWNER OVERRIDE — exporting with blocking errors:\n\n' +
                errors.map(fmt).join('\n') + '\n\nExport anyway?')) return;
        }

        const warnings = issues.filter(i => i.level === 'warning');
        if (warnings.length > 0) {
            const proceed = confirm(
                'Please check these points:\n\n' +
                warnings.map(fmt).join('\n') +
                '\n\nDownload anyway?'
            );
            if (!proceed) return;
        }

        const xml = generateStackXML(state.data);
        const baseName = state.data.name || 'question';
        const suffix = state.data.examMode ? '_with_notes' : '';
        downloadFile(xml, baseName + suffix + '.xml', 'application/xml');
        // A6 pass-state copy: never overclaim what the checks prove.
        showNotification('Structure checks passed. Always preview the question in Moodle before giving it to students.', 'success');
    });

    // Preview XML
    document.getElementById('btn-preview-xml')?.addEventListener('click', () => {
        const xml = generateStackXML(state.data);
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write('<pre>' + escapeHtml(xml) + '</pre>');
            previewWindow.document.title = LABELS.previewWindowTitle;
        }
    });

    // Generate initial sample values and render
    state.generateSampleValues();
    state.notify();
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Reads /test-status.json written by the custom Vitest reporter.
 * Returns { ok: true, timestamp? } when tests have passed, or
 * { ok: false, reason: 'not-run' | 'fail' | 'error', ... } otherwise.
 * Production builds short-circuit to ok — the gate is dev-only (P-TEST-01).
 */
async function checkTestStatus() {
    if (!import.meta.env.DEV) return { ok: true };
    try {
        const res = await fetch('/test-status.json', { cache: 'no-store' });
        if (!res.ok) return { ok: false, reason: 'not-run' };
        const data = await res.json();
        if (data.status !== 'pass') {
            return { ok: false, reason: 'fail', failed: data.failed, timestamp: data.timestamp };
        }
        return { ok: true, timestamp: data.timestamp };
    } catch {
        return { ok: false, reason: 'error' };
    }
}

function showNotification(message, type = 'info') {
    // Create temporary notification
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
