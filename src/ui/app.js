// Application initialization and event handler setup
import StateManager from '../core/state.js';
import UIManager from './ui-manager.js';
import { generateStackXML } from '../generators/xml-generator.js';
import { TEMPLATES } from '../templates/index.js';
import { validateQuestionData } from '../core/validators.js';

function initApp() {
    const state = new StateManager();
    const ui = new UIManager(state);

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
                if (file.name.endsWith('.xml')) {
                    state.loadFromXml(content);
                    showNotification('XML file imported successfully.', 'success');
                } else {
                    state.loadFromJson(content);
                    showNotification('JSON file loaded successfully.', 'success');
                }
            } catch (err) {
                showNotification('Error: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Export XML
    document.getElementById('btn-export-xml')?.addEventListener('click', () => {
        // Validate first
        const issues = validateQuestionData(state.data);
        const errors = issues.filter(i => i.level === 'error');

        if (errors.length > 0) {
            const errorMsg = 'Cannot export — fix these errors first:\n\n' +
                errors.map(e => '- ' + e.message).join('\n');
            showNotification(errorMsg, 'error');
            return;
        }

        const warnings = issues.filter(i => i.level === 'warning');
        if (warnings.length > 0) {
            const proceed = confirm(
                'Warnings found:\n\n' +
                warnings.map(w => '- ' + w.message).join('\n') +
                '\n\nExport anyway?'
            );
            if (!proceed) return;
        }

        const xml = generateStackXML(state.data);
        downloadFile(xml, (state.data.name || 'question') + '.xml', 'application/xml');
        showNotification('XML exported successfully.', 'success');
    });

    // Preview XML
    document.getElementById('btn-preview-xml')?.addEventListener('click', () => {
        const xml = generateStackXML(state.data);
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write('<pre>' + escapeHtml(xml) + '</pre>');
            previewWindow.document.title = 'XML Preview';
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

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
