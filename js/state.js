import { parseStackXML } from './xml-parser.js';

export default class StateManager {
    constructor() {
        this.listeners = [];
        this.data = {
            name: "New STACK Question",
            questionText: "Calculate the energy stored in the inductor.",
            variables: [
                { name: "L", type: "rand", value: "rand(10)+1" },
                { name: "I", type: "rand", value: "rand(5)+1" },
                { name: "ans1", type: "calc", value: "0.5 * L * I * I" }
            ],
            // Updated Parts Structure
            parts: [
                { 
                    id: 1, 
                    type: "numerical", 
                    text: "Calculate Energy (Joules):",
                    answer: "ans1", 
                    grading: {
                        tightTol: 0.05,
                        wideTol: 0.20,
                        checkSigFigs: true,
                        sigFigs: 3,
                        penalty: 0.1,
                        checkPowerOf10: true,
                        powerOf10Penalty: 0.5
                    },
                    options: [], // For MCQ
                    graphCode: "", // For JSXGraph
                    gradingCode: "" // For custom Maxima validation
                }
            ],
            images: [] 
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
        if (!this.data.images) this.data.images = [];
        this.notify();
    }

    // --- Variables ---
    addVariable(name = null) {
        const newName = name || ("v" + (this.data.variables.length + 1));
        this.data.variables.push({ name: newName, type: "rand", value: "rand(10)" });
        this.notify();
    }

    scanVariables() {
        const texts = [this.data.questionText];
        this.data.parts.forEach(p => {
            texts.push(p.text);
            texts.push(p.answer);
        });

        const combined = texts.join(" ");
        const matches = combined.match(/\{@([a-zA-Z0-9_]+)@\}/g) || [];
        const uniqueVars = [...new Set(matches.map(m => m.replace(/\{@|@\}/g, '')))];

        let addedCount = 0;
        uniqueVars.forEach(vName => {
            if (!this.data.variables.find(v => v.name === vName)) {
                this.data.variables.push({ name: vName, type: "rand", value: "rand(10)" });
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
        this.data.variables[index][key] = val;
        this.notify();
    }

    removeVariable(index) {
        this.data.variables.splice(index, 1);
        this.notify();
    }

    moveVariable(index, direction) {
        // direction: -1 for up, 1 for down
        const newIndex = parseInt(index) + direction;
        if (newIndex < 0 || newIndex >= this.data.variables.length) return;

        const item = this.data.variables.splice(index, 1)[0];
        this.data.variables.splice(newIndex, 0, item);
        
        this.generateSampleValues(); // Regenerate values as order affects dependency resolution
        this.notify();
    }

    // --- General ---
    updateGeneral(name, text) {
        this.data.name = name;
        this.data.questionText = text;
        this.notify();
    }

    // --- Images ---
    addImage(fileObj) {
        // Check if exists to prevent duplicates if user re-uploads same file
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
            type: "numerical", 
            text: `Part ${String.fromCharCode(96 + id)}...`,
            answer: "ans" + id, 
            grading: { 
                tightTol: 0.05, wideTol: 0.20, checkSigFigs: true, sigFigs: 3, 
                penalty: 0.1, checkPowerOf10: true, powerOf10Penalty: 0.5 
            },
            options: [],
            graphCode: "",
            gradingCode: ""
        });
        this.notify();
    }

    updatePart(index, key, val) {
        this.data.parts[index][key] = val;
        this.notify();
    }
    
    updatePartGrading(index, key, val) {
        this.data.parts[index].grading[key] = val;
        this.notify();
    }

    updatePartGradingBatch(index, configObj) {
        this.data.parts[index].grading = { ...this.data.parts[index].grading, ...configObj };
        this.notify();
    }

    // MCQ Options Management
    addPartOption(partIdx) {
        if (!this.data.parts[partIdx].options) this.data.parts[partIdx].options = [];
        this.data.parts[partIdx].options.push({ value: `Option ${this.data.parts[partIdx].options.length + 1}`, correct: false });
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
        this.notify();
    }

    // Helper to normalize imported data to current structure
    _normalize(data) {
        if (!data.images) data.images = [];
        // CRITICAL FIX: Ensure arrays exist to prevent crashes
        if (!data.variables) data.variables = [];
        if (!data.parts) data.parts = [];
        
        // Clean Variables
        if (data.variables) {
            data.variables.forEach(v => {
                if (v.value) {
                    // Normalize: Remove trailing semicolons
                    v.value = v.value.replace(/;+$/, '').trim();
                    // Normalize: Fix incorrect syntax "rand([...])[1]" which crashes Moodle
                    v.value = v.value.replace(/(rand\s*\(\s*\[[^\]]+\]\s*\))\s*\[1\]/g, '$1');
                }
            });
        }
        
        if (data.parts) {
            data.parts = data.parts.map(p => {
                // Fix missing grading object (common in legacy/simplified templates)
                if (!p.grading) {
                    p.grading = {
                        tightTol: p.tol || 0.05,
                        wideTol: 0.20,
                        checkSigFigs: false,
                        sigFigs: 3,
                        penalty: 0.1,
                        checkPowerOf10: false,
                        powerOf10Penalty: 0.5
                    };
                    p.text = p.text || "Find the value:";
                }
                
                // Ensure checkPowerOf10 exists if loading old JSON
                if (p.grading.checkPowerOf10 === undefined) {
                    p.grading.checkPowerOf10 = false;
                    p.grading.powerOf10Penalty = 0.5;
                }
                
                if (!p.options) p.options = [];
                if (!p.graphCode) p.graphCode = "";
                if (!p.gradingCode) p.gradingCode = "";
                
                return p;
            });
        }
        return data;
    }

    loadFromJson(jsonString) {
        try {
            let parsed = JSON.parse(jsonString);
            parsed = this._normalize(parsed);
            
            this.data = parsed;
            this.generateSampleValues(); 
            this.notify();
        } catch (e) {
            console.error(e);
            alert("Failed to load file.");
        }
    }
    
    loadFromXml(xmlString) {
        try {
            let data = parseStackXML(xmlString);
            data = this._normalize(data);
            
            this.data = data;
            this.generateSampleValues();
            this.notify();
        } catch(e) {
            console.error(e);
            alert("Failed to load XML: " + e.message);
        }
    }

    loadTemplate(templateData) {
        // Deep copy to prevent mutating the imported template constant
        let data = JSON.parse(JSON.stringify(templateData));
        data = this._normalize(data);
        
        this.data = data;
        try {
            this.generateSampleValues();
        } catch(e) {
            console.warn("Error generating samples during template load:", e);
        }
        this.notify();
    }

    generateSampleValues() {
        this.previewValues = {};
        
        // Guard clause
        if(!this.data.variables) return;

        this.data.variables.forEach(v => {
            try {
                // Strip trailing semicolons for JS processing
                let expr = v.value ? v.value.trim() : "";
                while (expr.endsWith(';')) {
                    expr = expr.slice(0, -1).trim();
                }

                if (v.type === 'rand') {
                    if (expr.includes('rand(')) {
                        // Handle list syntax: rand([1, 2, 3])
                        const listMatch = expr.match(/rand\(\s*\[([^\]]+)\]\s*\)/);
                        if (listMatch) {
                            // Extract items from rand([a,b,c])
                            const items = listMatch[1].split(',').map(s => {
                                const n = parseFloat(s);
                                return isNaN(n) ? s.trim() : n;
                            });
                            // Pick random item
                            this.previewValues[v.name] = items[Math.floor(Math.random() * items.length)];
                        } else if (expr.includes('rand_with_step')) {
                             const parts = expr.match(/rand_with_step\(([^,]+),([^,]+),([^)]+)\)/);
                             if(parts) {
                                 const min = parseFloat(parts[1]);
                                 const max = parseFloat(parts[2]);
                                 const step = parseFloat(parts[3]);
                                 const steps = Math.floor((max - min) / step);
                                 const randStep = Math.floor(Math.random() * (steps + 1));
                                 this.previewValues[v.name] = (min + (randStep * step)).toFixed(2);
                             } else {
                                 this.previewValues[v.name] = 0;
                             }
                        } else {
                             // Standard rand(n)
                             const match = expr.match(/rand\((\d+)\)/);
                             const max = match ? parseInt(match[1]) : 10;
                             this.previewValues[v.name] = Math.floor(Math.random() * max);
                        }
                    } else {
                         // Fallback for simple values or if rand() isn't matched
                        this.previewValues[v.name] = expr.match(/^\d+$/) ? parseInt(expr) : Math.floor(Math.random() * 10);
                    }
                } else if (v.type === 'algebraic') {
                    // Algebraic / Maxima mode: Substitute variables, no eval
                    Object.keys(this.previewValues).forEach(prevKey => {
                        const regex = new RegExp(`\\b${prevKey}\\b`, 'g');
                        // Use parens to be safe with operations
                        expr = expr.replace(regex, `(${this.previewValues[prevKey]})`);
                    });
                    this.previewValues[v.name] = expr;
                } else {
                    // Calc mode (Numeric JS Eval)
                    Object.keys(this.previewValues).forEach(prevKey => {
                        const regex = new RegExp(`\\b${prevKey}\\b`, 'g');
                        expr = expr.replace(regex, `(${this.previewValues[prevKey]})`);
                    });
                    
                    expr = expr.replace(/sin\(/g, 'Math.sin(');
                    expr = expr.replace(/cos\(/g, 'Math.cos(');
                    expr = expr.replace(/pi/g, 'Math.PI');
                    expr = expr.replace(/\^/g, '**');

                    if (/^[0-9+\-*/().\sMathPIeE]+$/.test(expr) || expr.includes('**')) {
                         // eslint-disable-next-line no-new-func
                        const result = Function('"use strict";return (' + expr + ')')();
                        this.previewValues[v.name] = typeof result === 'number' ? parseFloat(result.toPrecision(5)) : result;
                    } else {
                        this.previewValues[v.name] = "[Calc Error]";
                    }
                }
            } catch (e) {
                this.previewValues[v.name] = "[Error]";
            }
        });
        this.notify();
    }
}