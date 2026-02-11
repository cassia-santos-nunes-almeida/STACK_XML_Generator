export default class UIManager {
    constructor(stateManager) {
        this.state = stateManager;
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
            toolbar: document.getElementById('q-text-toolbar')
        };
        this.lastFocusedVarInput = null;
        this.init();
    }

    init() {
        setTimeout(() => {
            if (!window.MathJax) {
                this.els.diagnostics.textContent = "MathJax not loaded.";
                this.els.diagnostics.classList.remove('hidden');
            }
        }, 3000);

        this.els.qName.addEventListener('input', (e) => this.state.updateGeneral(e.target.value, this.els.qText.value));
        this.els.qText.addEventListener('input', (e) => this.state.updateGeneral(this.els.qName.value, e.target.value));

        // Toolbar Event Delegation
        if (this.els.toolbar) {
            this.els.toolbar.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (btn && btn.dataset.insert) {
                    e.preventDefault();
                    this.insertIntoField(this.els.qText, btn.dataset.insert);
                    const event = new Event('input', { bubbles: true });
                    this.els.qText.dispatchEvent(event);
                }
            });
        }

        // Syntax Helpers (Variables & General)
        document.querySelectorAll('.syntax-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const txt = e.target.getAttribute('data-insert');
                
                // Determine target based on button location
                if (btn.closest('.helper-bar')) {
                    // It's a Variable Helper -> Target last variable input
                    let target = this.lastFocusedVarInput;
                    
                    // Fallback: If no input focused yet, target the last Value input in the list
                    if (!target || !document.body.contains(target)) {
                        const allVarVals = this.els.varList.querySelectorAll('.var-val');
                        if (allVarVals.length > 0) target = allVarVals[allVarVals.length - 1];
                    }

                    if (target) {
                        this.insertIntoField(target, txt);
                        const event = new Event('change', { bubbles: true });
                        target.dispatchEvent(event);
                    } else {
                        alert("Please add a variable and select its value field first.");
                    }
                } else {
                    // It's a general helper -> Target active element or Question Text
                    this.insertAtCursor(txt);
                    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                        const event = new Event('change', { bubbles: true });
                        document.activeElement.dispatchEvent(event);
                    }
                }
            });
        });

        this.els.dropZone.addEventListener('click', () => this.els.imgInput.click());
        this.els.imgInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (evt) => {
                    this.state.addImage({
                        name: file.name.replace(/\s+/g, '_'), 
                        data: evt.target.result
                    });
                    this.els.imgInput.value = '';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    insertAtCursor(myValue) {
        const myField = document.activeElement;
        const target = (myField && (myField.tagName === "TEXTAREA" || myField.tagName === "INPUT")) ? myField : this.els.qText;
        this.insertIntoField(target, myValue);
    }

    insertIntoField(field, value) {
        if (field.selectionStart || field.selectionStart === '0' || field.selectionStart === 0) {
            var startPos = field.selectionStart;
            var endPos = field.selectionEnd;
            field.value = field.value.substring(0, startPos) + value + field.value.substring(endPos, field.value.length);
            field.focus();
            field.selectionStart = startPos + value.length;
            field.selectionEnd = startPos + value.length;
        } else {
            field.value += value;
        }
    }

    render(data, previewValues) {
        if (document.activeElement !== this.els.qName) this.els.qName.value = data.name;
        if (document.activeElement !== this.els.qText) this.els.qText.value = data.questionText;

        this.renderToolbar(data.variables);
        this.renderImages(data.images);
        this.renderVariables(data.variables);
        this.renderParts(data.parts, data.variables); // Pass variables to populate datalist
        this.renderPreview(data, previewValues);
    }

    renderToolbar(variables) {
        const container = document.getElementById('toolbar-vars');
        if(!container) return;
        
        container.innerHTML = '';
        if(!variables || variables.length === 0) {
            container.innerHTML = '<span style="font-size:0.8rem; color:#999; align-self:center; padding:0 5px;">No variables</span>';
            return;
        }

        variables.forEach(v => {
            const btn = document.createElement('button');
            btn.className = 'var-chip';
            btn.dataset.insert = `{@${v.name}@}`;
            btn.textContent = `{@${v.name}@}`;
            btn.title = `Insert variable ${v.name}`;
            container.appendChild(btn);
        });
    }

    renderVariables(variables) {
        this.els.varList.innerHTML = '';
        if (variables.length === 0) {
            this.els.varList.innerHTML = '<div style="padding:10px; color:#666; text-align:center; font-style:italic;">No variables defined. Click "Add" or "Auto-Detect".</div>';
            return;
        }
        
        const total = variables.length;

        variables.forEach((v, index) => {
            const div = document.createElement('div');
            div.className = 'var-item grid-row';
            // Added Order buttons (Up/Down)
            div.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <button class="small-btn move-up" data-idx="${index}" ${index === 0 ? 'disabled' : ''} style="padding:0px 4px; font-size:10px;">▲</button>
                    <button class="small-btn move-down" data-idx="${index}" ${index === total-1 ? 'disabled' : ''} style="padding:0px 4px; font-size:10px;">▼</button>
                </div>
                <input type="text" value="${v.name}" placeholder="Name" class="var-name" data-idx="${index}">
                <select class="var-type" data-idx="${index}">
                    <option value="rand" ${v.type === 'rand' ? 'selected' : ''}>Random (rand)</option>
                    <option value="calc" ${v.type === 'calc' ? 'selected' : ''}>Numeric (JS Eval)</option>
                    <option value="algebraic" ${v.type === 'algebraic' ? 'selected' : ''}>Algebraic (Order Matters!)</option>
                </select>
                <input type="text" value="${v.value}" placeholder="Expr (e.g. rand(5) or a*x+b)" class="var-val" data-idx="${index}">
                <button class="danger-btn del-var" data-idx="${index}">×</button>
            `;
            this.els.varList.appendChild(div);
        });

        // Add Listeners
        this.els.varList.querySelectorAll('input, select').forEach(el => {
            if (el.tagName === 'INPUT') {
                el.addEventListener('focus', (e) => {
                    this.lastFocusedVarInput = e.target;
                });
            }

            el.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                const field = e.target.classList.contains('var-name') ? 'name' : 
                              e.target.classList.contains('var-type') ? 'type' : 'value';
                this.state.updateVariable(idx, field, e.target.value);
                this.state.generateSampleValues();
            });
        });
        
        // Remove
        this.els.varList.querySelectorAll('.del-var').forEach(btn => {
            btn.addEventListener('click', (e) => this.state.removeVariable(e.target.dataset.idx));
        });

        // Move Up/Down
        this.els.varList.querySelectorAll('.move-up').forEach(btn => {
            btn.addEventListener('click', (e) => this.state.moveVariable(e.target.dataset.idx, -1));
        });
        this.els.varList.querySelectorAll('.move-down').forEach(btn => {
            btn.addEventListener('click', (e) => this.state.moveVariable(e.target.dataset.idx, 1));
        });
    }

    renderParts(parts, variables = []) {
        const GRADING_PRESETS = {
            engineering: { 
                name: "Standard Engineering", 
                cfg: { tightTol: 0.05, wideTol: 0.20, checkSigFigs: true, sigFigs: 3, penalty: 0.1, checkPowerOf10: true, powerOf10Penalty: 0.5 }
            },
            physics: { 
                name: "Physics Lab (Strict)", 
                cfg: { tightTol: 0.01, wideTol: 0.05, checkSigFigs: true, sigFigs: 4, penalty: 0.25, checkPowerOf10: true, powerOf10Penalty: 0.5 }
            },
            conceptual: { 
                name: "Conceptual (Wide)", 
                cfg: { tightTol: 0.15, wideTol: 0.50, checkSigFigs: false, sigFigs: 2, penalty: 0.0, checkPowerOf10: false, powerOf10Penalty: 0.0 }
            }
        };

        const varOptions = variables.map(v => `<option value="${v.name}">${v.name} (${v.type})</option>`).join('');
        let datalist = document.getElementById('var-datalist');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'var-datalist';
            document.body.appendChild(datalist);
        }
        datalist.innerHTML = varOptions;

        this.els.partList.innerHTML = '';
        parts.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = 'part-card';
            
            // Grading UI Logic
            let gradingHtml = '';
            // Options UI Logic (MCQ)
            let optionsHtml = '';

            // Handle JSXGraph Special Layout
            if (p.type === 'jsxgraph') {
                const refVar = `${p.answer}Ref`;
                
                gradingHtml = `
                    <div class="grading-pipeline">
                        <div class="pipeline-step active">
                            <div class="step-icon">★</div>
                            <div class="step-content">
                                <div class="step-title">Grading Logic (Server-Side Maxima)</div>
                                <small style="color:#666; display:block; margin-bottom:5px;">
                                    This code runs on the server after submission.<br>
                                    Use the variable <code>${p.answer}</code> to access the student's data (e.g. list of points).<br>
                                    The variable <code>all_correct</code> must be set to <code>true</code> for full marks.
                                </small>
                                <textarea class="part-grad-code" data-idx="${index}" style="font-family:monospace; min-height:100px; font-size:0.85rem; background:#f0f9ff; border-color:#bae6fd;">${p.gradingCode || 'all_correct: true;'}</textarea>
                            </div>
                        </div>
                    </div>`;

                // Add Graph Code Editor
                optionsHtml = `
                    <div style="margin:15px 0;">
                        <label>JSXGraph Logic (Client-Side JavaScript)</label>
                        <small style="display:block; color:#666; margin-bottom:5px; background:#fffbeb; padding:8px; border-left:3px solid #f59e0b; border-radius:4px;">
                            <strong>Data Binding:</strong><br>
                            STACK automatically creates a JS variable <code>${refVar}</code> containing the hidden input's ID.<br>
                            To save the answer, update the input value using this ID:<br>
                            <code style="display:block; margin-top:4px; color:#333;">document.getElementById(${refVar}).value = "[[1,2], [3,4]]";</code>
                        </small>
                        <textarea class="part-graph-code" data-idx="${index}" style="font-family:monospace; min-height:150px; background:#fdfdfd; border-left:4px solid #2563eb;">${p.graphCode}</textarea>
                    </div>
                `;
            } else if (p.type === 'radio') {
                const opts = p.options || [];
                optionsHtml = `
                    <div style="margin:10px 0; background:#f0fdf4; padding:10px; border:1px solid #bbf7d0; border-radius:6px;">
                        <label style="color:#166534;">Answer Choices (Check correct option)</label>
                        <div id="opts-list-${index}">
                            ${opts.map((o, optI) => `
                                <div class="mcq-option">
                                    <input type="radio" name="correct-opt-${index}" ${o.correct ? 'checked' : ''} class="opt-correct" data-idx="${index}" data-opt="${optI}">
                                    <input type="text" value="${o.value.replace(/"/g, '&quot;')}" placeholder="Option Text, HTML, or Plot" class="opt-val" data-idx="${index}" data-opt="${optI}">
                                    <button class="small-btn img-opt" data-idx="${index}" data-opt="${optI}" title="Upload Image" style="padding:4px 6px;">🖼️</button>
                                    <button class="small-btn plot-opt" data-idx="${index}" data-opt="${optI}" title="Insert Dynamic Plot" style="padding:4px 6px;">📈</button>
                                    <button class="danger-btn del-opt" data-idx="${index}" data-opt="${optI}">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="small-btn add-opt" data-idx="${index}">+ Add Option</button>
                        <small style="display:block; margin-top:5px; color:#555;">Use 🖼️ for images, or 📈 to generate dynamic graphs (e.g., matching curves).</small>
                    </div>
                `;
                gradingHtml = `<div style="padding:15px; background:#f9f9f9; color:#555; text-align:center;">Grading is automatic based on the selected "Correct" option above.</div>`;
            } else {
                 // Standard Numerical/Algebraic Grading
                 switch(p.type) {
                    case 'numerical':
                        gradingHtml = `
                            <div class="grading-pipeline">
                                <div class="pipeline-step active">
                                    <div class="step-icon">1</div>
                                    <div class="step-content">
                                        <div class="step-title">Accuracy Check (Value) <span>Score</span></div>
                                        <div class="grading-inputs">
                                            <div>
                                                <label class="small-label">Absolute Tolerance (100% Score)</label>
                                                <input type="number" step="0.01" value="${p.grading.tightTol}" class="part-grad-tight" data-idx="${index}">
                                            </div>
                                            <div>
                                                <label class="small-label">Wide Tolerance (Partial Credit)</label>
                                                <input type="number" step="0.01" value="${p.grading.wideTol}" class="part-grad-wide" data-idx="${index}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="pipeline-step secondary-step">
                                    <div class="step-icon">2</div>
                                    <div class="step-content">
                                        <div class="step-title">
                                            Precision Check (Sig Figs)
                                            <input type="checkbox" ${p.grading.checkSigFigs ? 'checked' : ''} class="part-grad-checksig" data-idx="${index}">
                                        </div>
                                        ${p.grading.checkSigFigs ? `
                                            <div class="grading-row">
                                                <label class="small-label" style="width:120px;">Required SigFigs:</label>
                                                <input type="number" value="${p.grading.sigFigs}" class="part-grad-sigfigs" data-idx="${index}" style="width:80px;">
                                            </div>
                                            <div class="grading-row">
                                                <label class="small-label" style="width:120px;">Penalty Deduction:</label>
                                                <input type="number" step="0.01" value="${p.grading.penalty}" class="part-grad-penalty" data-idx="${index}" style="width:80px;">
                                            </div>
                                        ` : '<small style="color:#999;">Skipped</small>'}
                                    </div>
                                </div>
                                <div class="pipeline-step check-step">
                                    <div class="step-icon">3</div>
                                    <div class="step-content">
                                        <div class="step-title">
                                            Sanity Check (Power of 10)
                                            <input type="checkbox" ${p.grading.checkPowerOf10 ? 'checked' : ''} class="part-grad-checkp10" data-idx="${index}">
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        break;
                    default:
                        gradingHtml = `<div style="padding:15px; background:#f9f9f9; color:#555;">Standard algebraic equivalence check (AlgEquiv).</div>`;
                        break;
                }
            }

            // Preset Dropdown (Numerical only)
            let presetSelect = '';
            if(p.type === 'numerical') {
                const opts = Object.entries(GRADING_PRESETS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
                presetSelect = `<div style="text-align:right; margin-bottom:10px;"><select class="part-grad-preset" data-idx="${index}" style="padding:4px; font-size:0.8rem;"><option value="">⚡ Load Grading Preset...</option>${opts}</select></div>`;
            }

            div.innerHTML = `
                <div class="part-header">
                    <strong>Part ${String.fromCharCode(65 + index)}</strong>
                    <button class="danger-btn del-part" data-idx="${index}">Remove Part</button>
                </div>
                
                <div class="part-body">
                    <div class="form-group">
                        <label>${p.type === 'jsxgraph' ? 'Instructions (HTML)' : 'Sub-Question Text'}</label>
                        <textarea class="part-text" data-idx="${index}">${p.text}</textarea>
                    </div>

                    <div class="grid-row" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group">
                            <label>Input Type</label>
                            <select class="part-type" data-idx="${index}">
                                <option value="numerical" ${p.type === 'numerical' ? 'selected' : ''}>Numerical</option>
                                <option value="algebraic" ${p.type === 'algebraic' ? 'selected' : ''}>Algebraic</option>
                                <option value="radio" ${p.type === 'radio' ? 'selected' : ''}>Multiple Choice (Radio)</option>
                                <option value="units" ${p.type === 'units' ? 'selected' : ''}>Numerical + Units</option>
                                <option value="matrix" ${p.type === 'matrix' ? 'selected' : ''}>Matrix</option>
                                <option value="jsxgraph" ${p.type === 'jsxgraph' ? 'selected' : ''}>Graph (JSXGraph)</option>
                                <option value="string" ${p.type === 'string' ? 'selected' : ''}>String</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Answer Variable <span class="tooltip" title="Variable that stores the student answer">?</span></label>
                            <input type="text" list="var-datalist" value="${p.answer}" class="part-ans" data-idx="${index}" ${p.type === 'radio' ? 'disabled title="Managed automatically for MCQ"' : ''} placeholder="Select or type variable...">
                        </div>
                    </div>

                    ${optionsHtml}

                    <div style="margin-top:20px;">
                        <h4 style="margin:0 0 10px 0; font-size:0.9rem; text-transform:uppercase; color:#777; border-bottom:1px solid #eee; padding-bottom:5px;">Grading Logic</h4>
                        ${presetSelect}
                        ${gradingHtml}
                    </div>
                </div>
            `;
            this.els.partList.appendChild(div);
        });

        // Universal Listeners
        this.els.partList.querySelectorAll('input, select, textarea').forEach(el => {
            // Skip managed elements
            if(el.classList.contains('opt-val') || el.classList.contains('opt-correct')) return;

            el.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                if (el.classList.contains('part-text')) this.state.updatePart(idx, 'text', el.value);
                else if (el.classList.contains('part-type')) this.state.updatePart(idx, 'type', el.value);
                else if (el.classList.contains('part-ans')) this.state.updatePart(idx, 'answer', el.value);
                else if (el.classList.contains('part-graph-code')) this.state.updatePart(idx, 'graphCode', el.value);
                else if (el.classList.contains('part-grad-code')) this.state.updatePart(idx, 'gradingCode', el.value);
                
                // Grading Configs
                else if (el.classList.contains('part-grad-tight')) this.state.updatePartGrading(idx, 'tightTol', el.value);
                else if (el.classList.contains('part-grad-wide')) this.state.updatePartGrading(idx, 'wideTol', el.value);
                else if (el.classList.contains('part-grad-checksig')) {
                    this.state.updatePartGrading(idx, 'checkSigFigs', el.checked);
                    this.renderParts(this.state.data.parts, this.state.data.variables);
                }
                else if (el.classList.contains('part-grad-sigfigs')) this.state.updatePartGrading(idx, 'sigFigs', el.value);
                else if (el.classList.contains('part-grad-penalty')) this.state.updatePartGrading(idx, 'penalty', el.value);
                else if (el.classList.contains('part-grad-checkp10')) this.state.updatePartGrading(idx, 'checkPowerOf10', el.checked);
                else if (el.classList.contains('part-grad-preset')) {
                    const val = el.value;
                    if (GRADING_PRESETS[val]) {
                        this.state.updatePartGradingBatch(idx, GRADING_PRESETS[val].cfg);
                        this.renderParts(this.state.data.parts, this.state.data.variables);
                    }
                }
            });
        });

        // MCQ Listeners
        this.els.partList.querySelectorAll('.add-opt').forEach(btn => btn.addEventListener('click', (e) => this.state.addPartOption(e.target.dataset.idx)));
        this.els.partList.querySelectorAll('.del-opt').forEach(btn => btn.addEventListener('click', (e) => this.state.removePartOption(e.target.dataset.idx, e.target.dataset.opt)));
        this.els.partList.querySelectorAll('.opt-val').forEach(input => input.addEventListener('change', (e) => this.state.updatePartOption(e.target.dataset.idx, e.target.dataset.opt, e.target.value)));
        this.els.partList.querySelectorAll('.opt-correct').forEach(radio => radio.addEventListener('change', (e) => this.state.setPartOptionCorrect(e.target.dataset.idx, e.target.dataset.opt)));

        // Image/Plot Buttons (Same as before)
        this.els.partList.querySelectorAll('.img-opt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const partIdx = e.target.dataset.idx;
                const optIdx = e.target.dataset.opt;
                const tempInput = document.createElement('input');
                tempInput.type = 'file';
                tempInput.accept = 'image/*';
                tempInput.onchange = (evt) => {
                    const file = evt.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (fileEvt) => {
                            const fileName = file.name.replace(/\s+/g, '_');
                            this.state.addImage({ name: fileName, data: fileEvt.target.result });
                            const htmlTag = `<img src="@@PLUGINFILE@@/${fileName}" alt="Option Image" width="200">`;
                            this.state.updatePartOption(partIdx, optIdx, htmlTag);
                        };
                        reader.readAsDataURL(file);
                    }
                };
                tempInput.click();
            });
        });

        this.els.partList.querySelectorAll('.plot-opt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const partIdx = e.target.dataset.idx;
                const optIdx = e.target.dataset.opt;
                const plotTag = `{@plot(x^2, [x, -5, 5])@}`;
                this.state.updatePartOption(partIdx, optIdx, plotTag);
            });
        });

        this.els.partList.querySelectorAll('.del-part').forEach(btn => {
            btn.addEventListener('click', (e) => this.state.removePart(e.target.dataset.idx));
        });
    }

    renderPreview(data, previewValues) {
        // Validation Logic
        const allText = data.questionText + " " + data.parts.map(p => p.text).join(" ");
        const varsFound = allText.match(/\{@([a-zA-Z0-9_]+)@\}/g) || [];
        const warnings = [];
        varsFound.forEach(tag => {
            const varName = tag.replace(/\{@|@\}/g, '');
            if (!data.variables.find(v => v.name === varName)) warnings.push(`Variable <strong>${varName}</strong> is used but not defined.`);
        });
        this.els.validationBox.innerHTML = warnings.length ? `<div class="warning-banner">${warnings.join('<br>')}</div>` : '';

        // Render Question Text
        let html = `<div>${this.processText(data.questionText, previewValues, data.images)}</div>`;
        if (data.images && data.images.length > 0) {
            html += `<div style="text-align:center; margin: 15px 0;">`;
            data.images.forEach(img => html += `<img src="${img.data}" alt="${img.name}" style="max-width:100%; border:1px solid #ddd; margin-bottom:5px;">`);
            html += `</div>`;
        }

        // Render Parts
        data.parts.forEach((p, i) => {
            const partText = this.processText(p.text, previewValues, data.images);
            let inputHtml = '';
            
            if (p.type === 'radio') {
                inputHtml = `<div style="margin-top:5px;">`;
                (p.options || []).forEach(opt => {
                     const optLabel = this.processText(opt.value, previewValues, data.images);
                     inputHtml += `<div style="margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                        <input type="radio" name="preview-rad-${i}" disabled> 
                        <div>${optLabel}</div>
                     </div>`;
                });
                inputHtml += `</div>`;
            } else if (p.type === 'jsxgraph') {
                // Specific JSXGraph Preview
                inputHtml = `
                    <div style="margin:10px 0; border:1px solid #ccc; background:#fdfdfd; padding:20px; text-align:center;">
                        <div style="width:400px; height:300px; background:#f0f9ff; border:2px dashed #2563eb; margin:0 auto; display:flex; align-items:center; justify-content:center; color:#2563eb; font-weight:bold;">
                            JSXGraph Interactive Area<br>(Rendered in Moodle)
                        </div>
                        <small style="color:#666; margin-top:5px; display:block;">Logic defined in "JSXGraph Logic" editor</small>
                    </div>
                    <input type="text" disabled value="[Hidden State Input]" style="width: 200px; background:#eee; color:#999; text-align:center;">
                `;
            } else {
                inputHtml = `<input type="text" disabled placeholder="Input for ${p.answer}" style="width: 200px; padding: 5px; margin-top:5px;">`;
            }

            html += `
                <div style="background:#f9f9f9; padding:10px; margin-top:10px; border-left:3px solid #ccc;">
                    <strong>(${String.fromCharCode(97+i)})</strong> 
                    <span>${partText}</span>
                    ${inputHtml}
                </div>`;
        });

        this.els.previewBox.innerHTML = html;
        this.els.liveVars.innerHTML = Object.entries(previewValues)
            .map(([k,v]) => `<li><span class="var-tag">${k}</span> <span class="equals">=</span> <code class="var-val-display">${String(v)}</code></li>`).join('');

        if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([this.els.previewBox]);
    }

    renderImages(images) {
        if (!images) return;
        this.els.imageList.innerHTML = '';
        images.forEach((img, idx) => {
            const div = document.createElement('div');
            div.className = 'image-card';
            div.innerHTML = `<img src="${img.data}"><div class="image-actions"><button class="danger-btn delete-img" data-idx="${idx}">Delete</button></div>`;
            this.els.imageList.appendChild(div);
        });
        this.els.imageList.querySelectorAll('.delete-img').forEach(btn => btn.addEventListener('click', (e) => this.state.removeImage(e.target.dataset.idx)));
    }

    processText(text, values, images = []) {
        if(!text) return "";
        let out = text;
        
        for (const [key, val] of Object.entries(values)) {
            const regex = new RegExp(`\\{@${key}@\\}`, 'g');
            let displayVal = String(val);
            if (typeof val === 'string' && (val.includes('*') || val.includes('('))) {
                 displayVal = displayVal.replace(/\*/g, ' '); 
            }
            out = out.replace(regex, displayVal);
        }

        if (images && images.length > 0) {
            images.forEach(img => {
                const namePattern = img.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`@@PLUGINFILE@@/${namePattern}`, 'g');
                out = out.replace(regex, img.data);
            });
        }
        
        out = out.replace(/\{@plot\(([^)]+)\)@\}/g, (match, args) => {
             const func = args.split(',')[0];
             return `<span style="display:inline-block; border:1px solid #ccc; background:#f0f0f0; padding:5px; border-radius:4px; font-size:0.8rem;">📈 [Dynamic Plot: ${func}]</span>`;
        });
        
        out = out.replace(/\[\[jsxgraph.*?\]\]([\s\S]*?)\[\[\/jsxgraph\]\]/g, () => {
             return `<div style="width:300px; height:200px; background:#fdfdfd; border:2px solid #0072bc; display:flex; align-items:center; justify-content:center; color:#0072bc; font-weight:bold;">Interactive Graph (JSXGraph)<br/>(Rendered in Moodle)</div>`;
        });

        return out.replace(/\n/g, "<br>");
    }
}