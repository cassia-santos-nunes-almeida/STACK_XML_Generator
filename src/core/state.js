// State Manager — centralized data model with observer pattern
// FIXES BUG 6: rand_with_step returns number
// FIXES BUG 7: Part IDs renumbered after deletion
import { parseStackXML } from '../parsers/xml-parser.js';
import { evaluatePreviewValue, detectVariableType } from '../parsers/variable-parser.js';
import { DEFAULT_GRADING } from './constants.js';

export default class StateManager {
    constructor() {
        this.listeners = [];
        this.data = {
            name: 'New STACK Question',
            questionText: '',
            variables: [],
            parts: [],
            images: [],
            generalFeedback: '',
            hints: [],
        };
        this.previewValues = {};
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(fn => fn(this.data, this.previewValues));
    }

    setState(newData) {
        this.data = { ...this.data, ...newData };
        this._ensureDefaults();
        this.notify();
    }

    // --- Variables ---

    addVariable(name = null) {
        const newName = name || ('v' + (this.data.variables.length + 1));
        this.data.variables.push({ name: newName, type: 'rand', value: 'rand(10)' });
        this.notify();
    }

    scanVariables() {
        const texts = [this.data.questionText];
        this.data.parts.forEach(p => {
            texts.push(p.text || '');
            texts.push(p.answer || '');
        });

        const combined = texts.join(' ');
        const matches = combined.match(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g) || [];
        const uniqueVars = [...new Set(matches.map(m => m.replace(/\{@|@\}/g, '')))];

        let addedCount = 0;
        uniqueVars.forEach(vName => {
            if (!this.data.variables.find(v => v.name === vName)) {
                this.data.variables.push({ name: vName, type: 'rand', value: 'rand(10)' });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.generateSampleValues();
            this.notify();
        }
        return addedCount;
    }

    updateVariable(index, key, val) {
        if (index >= 0 && index < this.data.variables.length) {
            this.data.variables[index][key] = val;
            this.notify();
        }
    }

    removeVariable(index) {
        if (index >= 0 && index < this.data.variables.length) {
            this.data.variables.splice(index, 1);
            this.notify();
        }
    }

    moveVariable(index, direction) {
        const newIndex = parseInt(index) + direction;
        if (newIndex < 0 || newIndex >= this.data.variables.length) return;

        const item = this.data.variables.splice(index, 1)[0];
        this.data.variables.splice(newIndex, 0, item);

        this.generateSampleValues();
        this.notify();
    }

    // --- General ---

    updateGeneral(name, text) {
        this.data.name = name;
        this.data.questionText = text;
        this.notify();
    }

    updateGeneralFeedback(text) {
        this.data.generalFeedback = text;
        this.notify();
    }

    // --- Hints ---

    addHint(text = '') {
        if (!this.data.hints) this.data.hints = [];
        this.data.hints.push(text || 'Consider reviewing the relevant formula.');
        this.notify();
    }

    updateHint(index, text) {
        if (this.data.hints && index >= 0 && index < this.data.hints.length) {
            this.data.hints[index] = text;
            this.notify();
        }
    }

    removeHint(index) {
        if (this.data.hints && index >= 0 && index < this.data.hints.length) {
            this.data.hints.splice(index, 1);
            this.notify();
        }
    }

    // --- Images ---

    addImage(fileObj) {
        const idx = this.data.images.findIndex(img => img.name === fileObj.name);
        if (idx >= 0) {
            this.data.images[idx] = fileObj;
        } else {
            this.data.images.push(fileObj);
        }
        this.notify();
    }

    removeImage(index) {
        this.data.images.splice(index, 1);
        this.notify();
    }

    // --- Parts ---

    addPart() {
        const id = this.data.parts.length + 1;
        this.data.parts.push({
            id: id,
            type: 'numerical',
            text: `Part ${String.fromCharCode(96 + id)}:`,
            answer: 'ans' + id,
            grading: { ...DEFAULT_GRADING },
            options: [],
            graphCode: '',
            gradingCode: '',
            feedback: {},
        });
        this.notify();
    }

    updatePart(index, key, val) {
        if (index >= 0 && index < this.data.parts.length) {
            this.data.parts[index][key] = val;
            this.notify();
        }
    }

    updatePartGrading(index, key, val) {
        if (index >= 0 && index < this.data.parts.length) {
            this.data.parts[index].grading[key] = val;
            this.notify();
        }
    }

    updatePartGradingBatch(index, configObj) {
        if (index >= 0 && index < this.data.parts.length) {
            this.data.parts[index].grading = { ...this.data.parts[index].grading, ...configObj };
            this.notify();
        }
    }

    updatePartFeedback(index, key, val) {
        if (index >= 0 && index < this.data.parts.length) {
            if (!this.data.parts[index].feedback) this.data.parts[index].feedback = {};
            this.data.parts[index].feedback[key] = val;
            this.notify();
        }
    }

    // MCQ Options
    addPartOption(partIdx) {
        if (!this.data.parts[partIdx].options) this.data.parts[partIdx].options = [];
        this.data.parts[partIdx].options.push({
            value: `Option ${this.data.parts[partIdx].options.length + 1}`,
            correct: false,
        });
        this.notify();
    }

    updatePartOption(partIdx, optIdx, val) {
        this.data.parts[partIdx].options[optIdx].value = val;
        this.notify();
    }

    setPartOptionCorrect(partIdx, optIdx) {
        this.data.parts[partIdx].options.forEach((o, i) => o.correct = (i === optIdx));
        this.notify();
    }

    removePartOption(partIdx, optIdx) {
        this.data.parts[partIdx].options.splice(optIdx, 1);
        this.notify();
    }

    removePart(index) {
        this.data.parts.splice(index, 1);
        // FIX BUG 7: Renumber parts after deletion
        this._renumberParts();
        this.notify();
    }

    // --- Import/Export ---

    loadFromJson(jsonString) {
        try {
            let parsed = JSON.parse(jsonString);
            parsed = this._normalize(parsed);
            this.data = parsed;
            this.generateSampleValues();
            this.notify();
        } catch (e) {
            console.error(e);
            throw new Error('Failed to load JSON: ' + e.message);
        }
    }

    loadFromXml(xmlString) {
        try {
            let data = parseStackXML(xmlString);
            data = this._normalize(data);
            this.data = data;
            this.generateSampleValues();
            this.notify();
        } catch (e) {
            console.error(e);
            throw new Error('Failed to load XML: ' + e.message);
        }
    }

    loadTemplate(templateData) {
        let data = JSON.parse(JSON.stringify(templateData));
        data = this._normalize(data);
        this.data = data;
        try {
            this.generateSampleValues();
        } catch (e) {
            console.warn('Error generating samples during template load:', e);
        }
        this.notify();
    }

    // --- Preview Values ---

    generateSampleValues() {
        this.previewValues = {};
        if (!this.data.variables) return;

        this.data.variables.forEach(v => {
            try {
                const value = evaluatePreviewValue(v.type, v.value, this.previewValues);
                this.previewValues[v.name] = value;
            } catch (e) {
                this.previewValues[v.name] = '[Error]';
            }
        });
        this.notify();
    }

    // --- Internal ---

    /** Renumber part IDs and answer variables after deletion */
    _renumberParts() {
        this.data.parts.forEach((p, idx) => {
            const newId = idx + 1;
            // Update answer variable reference if it follows the ansN pattern
            if (p.answer === `ans${p.id}`) {
                p.answer = `ans${newId}`;
            }
            p.id = newId;
        });
    }

    /** Ensure all required fields exist */
    _ensureDefaults() {
        if (!this.data.images) this.data.images = [];
        if (!this.data.variables) this.data.variables = [];
        if (!this.data.parts) this.data.parts = [];
        if (!this.data.hints) this.data.hints = [];
        if (this.data.generalFeedback === undefined) this.data.generalFeedback = '';
    }

    /** Normalize imported data to current structure */
    _normalize(data) {
        if (!data.images) data.images = [];
        if (!data.variables) data.variables = [];
        if (!data.parts) data.parts = [];
        if (!data.hints) data.hints = [];
        if (data.generalFeedback === undefined) data.generalFeedback = '';

        // Clean variables
        data.variables.forEach(v => {
            if (v.value) {
                v.value = v.value.replace(/;+$/, '').trim();
                // Fix incorrect syntax "rand([...])[1]"
                v.value = v.value.replace(/(rand\s*\(\s*\[[^\]]+\]\s*\))\s*\[1\]/g, '$1');
            }
        });

        // Normalize parts
        data.parts = data.parts.map((p, idx) => {
            if (!p.grading) {
                p.grading = { ...DEFAULT_GRADING };
            } else {
                // Fill in any missing grading fields
                for (const [key, val] of Object.entries(DEFAULT_GRADING)) {
                    if (p.grading[key] === undefined) p.grading[key] = val;
                }
            }

            if (!p.options) p.options = [];
            if (!p.graphCode) p.graphCode = '';
            if (!p.gradingCode) p.gradingCode = '';
            if (!p.feedback) p.feedback = {};
            if (!p.text) p.text = `Part ${String.fromCharCode(97 + idx)}:`;
            if (!p.id) p.id = idx + 1;
            if (!p.answer) p.answer = `ans${p.id}`;

            return p;
        });

        return data;
    }
}
