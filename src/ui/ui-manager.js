// UI Manager — thin coordinator that delegates to specialized renderers
import { renderToolbar } from './render-toolbar.js';
import { renderVariables } from './render-variables.js';
import { renderParts } from './render-parts.js';
import { renderPreview } from './render-preview.js';
import { renderImages, renderFeedbackEditor, renderHints } from './render-general.js';

export default class UIManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.lastFocusedVarInput = null;

        this.els = {
            qName: document.getElementById('q-name'),
            qText: document.getElementById('q-text'),
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
        };
    }

    init() {
        this._initMathJaxCheck();
        this._initGeneralEvents();
        this._initToolbarEvents();
        this._initImageEvents();
    }

    render(data, previewValues) {
        // Sync input values
        if (this.els.qName && this.els.qName.value !== data.name) {
            this.els.qName.value = data.name || '';
        }
        if (this.els.qText && this.els.qText.value !== data.questionText) {
            this.els.qText.value = data.questionText || '';
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
        const { GRAPH_GRADING_TEMPLATES } = require('../generators/prts/jsxgraph-prt.js');
        const part = this.state.data.parts[partIdx];
        if (!part) return;

        const ansVar = part.answer || 'ans1';

        // Generate preset graph code and grading code
        const presetGraphCode = generatePresetGraphCode(presetKey, ansVar);
        const presetGradingCode = GRAPH_GRADING_TEMPLATES[presetKey]?.(ansVar, 5, 5) || '';

        this.state.updatePart(partIdx, 'graphCode', presetGraphCode);
        this.state.updatePart(partIdx, 'gradingCode', presetGradingCode);
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

/**
 * Generates preset graph JavaScript code for common graph types.
 */
function generatePresetGraphCode(presetKey, ansVar) {
    const refVar = `${ansVar}Ref`;

    switch (presetKey) {
        case 'pointPlacement':
            return `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-5, 70, 65, -70],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

board.create('text', [62, -5, 't'], {fontSize: 14});
board.create('text', [-3, 65, 'f(t)'], {fontSize: 14});

var studentPoints = [];

board.on('down', function(e) {
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    if (studentPoints.length < 5) {
        var p = board.create('point', [x, y], {
            name: '(' + x + ',' + y + ')',
            size: 4, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb'
        });
        studentPoints.push(p);

        if (studentPoints.length > 1) {
            board.create('segment',
                [studentPoints[studentPoints.length-2], studentPoints[studentPoints.length-1]],
                {strokeColor: '#ef4444', strokeWidth: 2}
            );
        }
        updateAnswer();
    }
});

function updateAnswer() {
    var arr = [];
    for (var i = 0; i < studentPoints.length; i++) {
        arr.push('[' + studentPoints[i].X().toFixed(0) + ',' + studentPoints[i].Y().toFixed(0) + ']');
    }
    var el = document.getElementById(${refVar});
    if(el) el.value = '[' + arr.join(',') + ']';
}

board.create('button', [5, 60, 'Reset', function() {
    JXG.JSXGraph.freeBoard(board);
    board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-5, 70, 65, -70],
        axis: true, showNavigation: true, showCopyright: false, grid: true
    });
    studentPoints = [];
    var el = document.getElementById(${refVar});
    if(el) el.value = '';
}]);`;

        case 'functionSketch':
            return `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-2, 12, 12, -2],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

var points = [];
var curve = null;

board.on('down', function(e) {
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0] * 2) / 2;
    var y = Math.round(coords[1] * 2) / 2;

    var p = board.create('point', [x, y], {
        size: 3, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb'
    });
    points.push(p);

    if (points.length > 1 && curve) board.removeObject(curve);
    if (points.length > 1) {
        curve = board.create('spline', points, {strokeColor: '#ef4444', strokeWidth: 2});
    }
    updateAnswer();
});

function updateAnswer() {
    var arr = [];
    for (var i = 0; i < points.length; i++) {
        arr.push('[' + points[i].X().toFixed(1) + ',' + points[i].Y().toFixed(1) + ']');
    }
    var el = document.getElementById(${refVar});
    if(el) el.value = '[' + arr.join(',') + ']';
}`;

        case 'vectorDraw':
            return `var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-10, 10, 10, -10],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

var startPt = board.create('point', [0, 0], {
    name: 'Start', size: 4, strokeColor: '#2563eb', fillColor: '#2563eb'
});
var endPt = board.create('point', [3, 4], {
    name: 'End', size: 4, strokeColor: '#ef4444', fillColor: '#ef4444'
});

board.create('arrow', [startPt, endPt], {strokeWidth: 3, strokeColor: '#10b981'});

function updateAnswer() {
    var el = document.getElementById(${refVar});
    if(el) el.value = '[' + startPt.X().toFixed(1) + ',' + startPt.Y().toFixed(1) + ',' +
                             endPt.X().toFixed(1) + ',' + endPt.Y().toFixed(1) + ']';
}

startPt.on('drag', updateAnswer);
endPt.on('drag', updateAnswer);
updateAnswer();`;

        default:
            return '// Custom graph code here';
    }
}
