// UI Manager — thin coordinator that delegates to specialized renderers
import { renderToolbar } from './render-toolbar.js';
import { renderVariables } from './render-variables.js';
import { renderParts } from './render-parts.js';
import { renderPreview } from './render-preview.js';
import { renderImages, renderFeedbackEditor, renderHints } from './render-general.js';
import { GRAPH_GRADING_TEMPLATES, generatePresetGraphCode } from '../generators/graph-presets.js';

export default class UIManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.lastFocusedVarInput = null;

        this.els = {
            qName: document.getElementById('q-name'),
            qText: document.getElementById('q-text'),
            qDefaultGrade: document.getElementById('q-default-grade'),
            qPenalty: document.getElementById('q-penalty'),
            varList: document.getElementById('variables-list'),
            partList: document.getElementById('parts-list'),
            previewBox: document.getElementById('preview-box'),
            liveVars: document.getElementById('live-vars'),
            templateSelect: document.getElementById('template-select'),
            diagnostics: document.getElementById('diagnostics'),
            validationBox: document.getElementById('validation-warnings'),
            imgInput: document.getElementById('img-input'),
            dropZone: document.getElementById('drop-zone'),
            imageList: document.getElementById('image-list'),
            toolbar: document.getElementById('toolbar-vars'),
            feedbackEditor: document.getElementById('feedback-editor'),
            hintsEditor: document.getElementById('hints-editor'),
            essayEnabled: document.getElementById('essay-enabled'),
            essaySettings: document.getElementById('essay-settings'),
            essayText: document.getElementById('essay-text'),
            essayGrade: document.getElementById('essay-grade'),
            essayAttachments: document.getElementById('essay-attachments'),
        };
    }

    init() {
        this._initMathJaxCheck();
        this._initGeneralEvents();
        this._initToolbarEvents();
        this._initImageEvents();
        this._initEssayEvents();
    }

    render(data, previewValues) {
        // Sync input values
        if (this.els.qName && this.els.qName.value !== data.name) {
            this.els.qName.value = data.name || '';
        }
        if (this.els.qText && this.els.qText.value !== data.questionText) {
            this.els.qText.value = data.questionText || '';
        }
        if (this.els.qDefaultGrade && this.els.qDefaultGrade.value !== String(data.defaultGrade ?? 1)) {
            this.els.qDefaultGrade.value = data.defaultGrade ?? 1;
        }
        if (this.els.qPenalty && this.els.qPenalty.value !== String(data.penalty ?? 0.1)) {
            this.els.qPenalty.value = data.penalty ?? 0.1;
        }

        // Render sub-sections
        renderToolbar(this.els.toolbar, data.variables, (val) => this.insertAtCursor(val));

        renderVariables(this.els.varList, data.variables, previewValues, {
            onUpdate: (idx, key, val) => this.state.updateVariable(idx, key, val),
            onMove: (idx, dir) => this.state.moveVariable(idx, dir),
            onDelete: (idx) => this.state.removeVariable(idx),
            onFocus: (el) => { this.lastFocusedVarInput = el; },
            onSyntaxInsert: (val) => this._insertIntoVarField(val),
        });

        renderParts(this.els.partList, data.parts, data.variables, {
            onUpdatePart: (idx, key, val) => this.state.updatePart(idx, key, val),
            onDeletePart: (idx) => this.state.removePart(idx),
            onGrading: (idx, key, val) => this.state.updatePartGrading(idx, key, val),
            onGradingBatch: (idx, config) => this.state.updatePartGradingBatch(idx, config),
            onFeedback: (idx, key, val) => this.state.updatePartFeedback(idx, key, val),
            onAddOption: (idx) => this.state.addPartOption(idx),
            onUpdateOption: (pIdx, oIdx, val) => this.state.updatePartOption(pIdx, oIdx, val),
            onSetCorrect: (pIdx, oIdx) => this.state.setPartOptionCorrect(pIdx, oIdx),
            onDeleteOption: (pIdx, oIdx) => this.state.removePartOption(pIdx, oIdx),
            onGraphPreset: (idx, preset) => this._applyGraphPreset(idx, preset),
        });

        renderImages(this.els.imageList, data.images, (idx) => this.state.removeImage(idx));

        renderFeedbackEditor(this.els.feedbackEditor, data.generalFeedback, (val) => this.state.updateGeneralFeedback(val));

        renderHints(this.els.hintsEditor, data.hints, {
            onAdd: () => this.state.addHint(),
            onUpdate: (idx, val) => this.state.updateHint(idx, val),
            onRemove: (idx) => this.state.removeHint(idx),
        });

        // Essay companion section
        this._renderEssay(data);

        renderPreview(this.els.previewBox, this.els.liveVars, this.els.validationBox, data, previewValues);
    }

    insertAtCursor(value) {
        const el = document.activeElement;
        if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
            this._insertIntoField(el, value);
        } else if (this.els.qText) {
            this._insertIntoField(this.els.qText, value);
        }
    }

    // --- Private ---

    _insertIntoField(field, value) {
        const start = field.selectionStart;
        const end = field.selectionEnd;
        field.value = field.value.substring(0, start) + value + field.value.substring(end);
        field.selectionStart = field.selectionEnd = start + value.length;
        field.focus();
        field.dispatchEvent(new Event('input'));
    }

    _insertIntoVarField(value) {
        if (this.lastFocusedVarInput) {
            this._insertIntoField(this.lastFocusedVarInput, value);
        }
    }

    _applyGraphPreset(partIdx, presetKey) {
        const part = this.state.data.parts[partIdx];
        if (!part) return;

        const ansVar = part.answer || 'ans1';
        const numPoints = part.graphMaxPoints || 5;
        const tolerance = part.graphTolerance || 5;

        const presetGraphCode = generatePresetGraphCode(presetKey, ansVar, numPoints);
        const presetGradingCode = GRAPH_GRADING_TEMPLATES[presetKey]?.(ansVar, numPoints, tolerance) || '';

        this.state.updatePart(partIdx, 'graphPreset', presetKey);
        this.state.updatePart(partIdx, 'graphCode', presetGraphCode);
        this.state.updatePart(partIdx, 'gradingCode', presetGradingCode);
    }

    _renderEssay(data) {
        if (this.els.essayEnabled) {
            this.els.essayEnabled.checked = !!data.essayEnabled;
        }
        if (this.els.essaySettings) {
            this.els.essaySettings.classList.toggle('hidden', !data.essayEnabled);
        }
        if (this.els.essayText && this.els.essayText !== document.activeElement) {
            this.els.essayText.value = data.essayText || '';
        }
        if (this.els.essayGrade && this.els.essayGrade !== document.activeElement) {
            this.els.essayGrade.value = data.essayGrade ?? 0;
        }
        if (this.els.essayAttachments && this.els.essayAttachments !== document.activeElement) {
            this.els.essayAttachments.value = data.essayAttachments ?? 1;
        }
    }

    _initEssayEvents() {
        if (this.els.essayEnabled) {
            this.els.essayEnabled.addEventListener('change', () => {
                this.state.updateEssay('essayEnabled', this.els.essayEnabled.checked);
            });
        }
        if (this.els.essayText) {
            this.els.essayText.addEventListener('input', () => {
                this.state.updateEssay('essayText', this.els.essayText.value);
            });
        }
        if (this.els.essayGrade) {
            this.els.essayGrade.addEventListener('change', () => {
                this.state.updateEssay('essayGrade', parseFloat(this.els.essayGrade.value) || 0);
            });
        }
        if (this.els.essayAttachments) {
            this.els.essayAttachments.addEventListener('change', () => {
                this.state.updateEssay('essayAttachments', parseInt(this.els.essayAttachments.value) || 1);
            });
        }
    }

    _initMathJaxCheck() {
        setTimeout(() => {
            if (this.els.diagnostics) {
                if (window.MathJax) {
                    this.els.diagnostics.classList.add('hidden');
                } else {
                    this.els.diagnostics.innerHTML = '<strong>Warning:</strong> MathJax not loaded. Math rendering may not work.';
                    this.els.diagnostics.classList.remove('hidden');
                }
            }
        }, 3000);
    }

    _initGeneralEvents() {
        if (this.els.qName) {
            this.els.qName.addEventListener('input', () => {
                this.state.updateGeneral(this.els.qName.value, this.els.qText?.value || '');
            });
        }
        if (this.els.qText) {
            this.els.qText.addEventListener('input', () => {
                this.state.updateGeneral(this.els.qName?.value || '', this.els.qText.value);
            });
        }
        if (this.els.qDefaultGrade) {
            this.els.qDefaultGrade.addEventListener('change', () => {
                this.state.data.defaultGrade = parseFloat(this.els.qDefaultGrade.value) || 1;
                this.state.notify();
            });
        }
        if (this.els.qPenalty) {
            this.els.qPenalty.addEventListener('change', () => {
                this.state.data.penalty = parseFloat(this.els.qPenalty.value) || 0;
                this.state.notify();
            });
        }
    }

    _initToolbarEvents() {
        // Static formatting buttons
        const toolbar = document.getElementById('q-text-toolbar');
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                const btn = e.target.closest('.tool-btn');
                if (btn && btn.dataset.insert) {
                    this.insertAtCursor(btn.dataset.insert);
                }
            });
        }

        // Syntax helper buttons
        const syntaxBtns = document.querySelectorAll('.syntax-btn');
        syntaxBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this._insertIntoVarField(btn.dataset.insert);
            });
        });
    }

    _initImageEvents() {
        const dropZone = this.els.dropZone;
        const imgInput = this.els.imgInput;

        if (dropZone) {
            dropZone.addEventListener('click', () => imgInput?.click());
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    this._processImageFile(e.dataTransfer.files[0]);
                }
            });
        }

        if (imgInput) {
            imgInput.addEventListener('change', () => {
                if (imgInput.files.length > 0) {
                    this._processImageFile(imgInput.files[0]);
                    imgInput.value = '';
                }
            });
        }
    }

    _processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.addImage({
                name: file.name,
                data: e.target.result,
            });
        };
        reader.readAsDataURL(file);
    }
}

