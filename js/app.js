import StateManager from './state.js';
import UIManager from './ui.js';
import { generateStackXML } from './xml-generator.js';
import { TEMPLATES } from './templates.js';

function initApp() {
    console.log("Initializing STACK Question Builder...");
    
    // 1. Initialize Modules
    const state = new StateManager();
    const ui = new UIManager(state);

    // 2. Subscribe UI to State changes
    state.subscribe((data, previewVals) => {
        ui.render(data, previewVals);
    });

    // 3. Initialize default state
    state.generateSampleValues();

    // 4. Global Action Buttons
    const btnAddVar = document.getElementById('btn-add-var');
    if (btnAddVar) btnAddVar.addEventListener('click', () => state.addVariable());

    // Auto-Detect Button
    const btnDetect = document.getElementById('btn-detect-vars');
    if (btnDetect) {
        btnDetect.addEventListener('click', () => {
             const count = state.scanVariables();
             if(count === 0) alert("No new variables found in text.");
             else alert(`Added ${count} new variables.`);
        });
    }
    
    const btnAddPart = document.getElementById('btn-add-part');
    if (btnAddPart) btnAddPart.addEventListener('click', () => state.addPart());
    
    const btnGenSample = document.getElementById('btn-gen-sample');
    if (btnGenSample) btnGenSample.addEventListener('click', () => state.generateSampleValues());

    // 5. Template Loading (Dropdown + Button)
    const tplSelect = document.getElementById('template-select');
    const btnLoadTemplate = document.getElementById('btn-load-template');

    // Populate options
    if (tplSelect) {
        Object.keys(TEMPLATES).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = TEMPLATES[key].name;
            tplSelect.appendChild(opt);
        });

        // Trigger loading immediately on change
        tplSelect.addEventListener('change', () => {
            const key = tplSelect.value;
            if (!key) return; // Ignore default option

            if (TEMPLATES[key]) {
                // Load the template immediately
                state.loadTemplate(TEMPLATES[key]);
                // Reset selection to default so user can see it "snapped" back and can select again if needed
                tplSelect.value = "";
            }
        });
    }

    // Keep "Load" button as a manual trigger if needed, or redundancy
    if (btnLoadTemplate && tplSelect) {
        btnLoadTemplate.addEventListener('click', () => {
             const key = tplSelect.value;
             if (!key) {
                alert("Please select a template from the list first.");
             } else if (TEMPLATES[key]) {
                state.loadTemplate(TEMPLATES[key]);
                tplSelect.value = "";
             }
        });
    }

    // 6. Save (JSON)
    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "stack-question.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    // 7. Load (JSON / XML)
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            
            reader.onload = (evt) => {
                const content = evt.target.result;
                if (file.name.endsWith('.xml')) {
                    state.loadFromXml(content);
                } else {
                    state.loadFromJson(content);
                }
                // Reset value to allow reloading same file
                fileUpload.value = '';
            };
            reader.readAsText(file);
        });
    }

    // 8. Export XML
    const btnExport = document.getElementById('btn-export-xml');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const xmlContent = generateStackXML(state.data);
            const blob = new Blob([xmlContent], { type: "application/xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = state.data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".xml";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}