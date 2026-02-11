export function parseStackXML(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    
    // Basic Validation
    const qNode = doc.querySelector("question");
    if (!qNode || qNode.getAttribute("type") !== 'stack') {
        throw new Error("Invalid file format: Not a STACK question XML.");
    }

    const state = {
        name: "",
        questionText: "",
        variables: [],
        parts: [],
        images: []
    };

    // 1. Name
    state.name = doc.querySelector("name text")?.textContent || "Imported Question";

    // 2. Variables
    const varText = doc.querySelector("questionvariables text")?.textContent || "";
    // Split by semicolon, filter empty lines
    const vars = varText.split(';').map(s => s.trim()).filter(s => s);
    
    vars.forEach(vStr => {
        // Regex to split "name: value" but ignore colons inside the value
        const match = vStr.match(/^([^:]+):(.*)$/);
        if (match) {
            const name = match[1].trim();
            const val = match[2].trim();
            
            // Skip internal variables used for MCQ lists (opt_ansX)
            if (name.startsWith('opt_ans')) return;

            // Heuristic for type
            let type = 'calc';
            if (val.includes('rand(') || val.includes('rand_')) {
                type = 'rand';
            } else if (/[a-zA-Z]/.test(val.replace(/(sin|cos|tan|exp|sqrt|log|pi|e)/g, ''))) {
                // If it has letters that aren't standard functions, might be algebraic/symbolic
                // But defaulting to 'calc' is usually safer for the previewer unless it explicitly fails
                type = 'calc'; 
            }
            
            state.variables.push({ name, type, value: val });
        }
    });

    // 3. Images & Question Text
    const qtNode = doc.querySelector("questiontext text");
    let htmlContent = qtNode?.textContent || ""; // CDATA content

    // Extract embedded files
    const fileNodes = doc.querySelectorAll("questiontext file");
    fileNodes.forEach(f => {
        const name = f.getAttribute("name");
        const b64 = f.textContent;
        // The generator strips the prefix, so we assume PNG default or try to detect
        // Re-adding a generic png prefix allows the browser to render it in most cases
        state.images.push({
            name: name,
            data: `data:image/png;base64,${b64}`
        });
    });

    // Parse HTML to separate Intro Text from Part Text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Remove artifacts added by generator
    const imgDiv = tempDiv.querySelector('.stack-images');
    if (imgDiv) imgDiv.remove();

    // Extract Part Texts
    // The generator wraps parts in <div class="stack-part">
    const partDivs = tempDiv.querySelectorAll('.stack-part');
    const partTexts = {}; // Map 'ans1' -> 'Text'
    
    partDivs.forEach((pd) => {
        // The text is usually in a <p>, often prefixed with <strong>(a)</strong>
        const pTag = pd.querySelector('p');
        if (pTag) {
             const cloneP = pTag.cloneNode(true);
             const strong = cloneP.querySelector('strong');
             if (strong) strong.remove(); // Remove (a)
             
             let text = cloneP.innerHTML.trim();
             
             // Find which input this belongs to
             const match = pd.innerHTML.match(/\[\[input:(ans\d+)\]\]/);
             if (match) {
                 partTexts[match[1]] = text;
             }
        }
        pd.remove();
    });

    // Remainder is the main question text
    state.questionText = tempDiv.innerHTML.trim();

    // 4. Inputs (Parts)
    const inputs = doc.querySelectorAll("input");
    inputs.forEach(inp => {
        const name = inp.querySelector("name")?.textContent;
        const type = inp.querySelector("type")?.textContent;
        const tans = inp.querySelector("tans")?.textContent;

        const part = {
            id: parseInt(name.replace('ans', '')) || (state.parts.length + 1),
            type: 'numerical', // Default
            text: partTexts[name] || "",
            answer: tans,
            options: [],
            grading: {
                tightTol: 0.05,
                wideTol: 0.20,
                checkSigFigs: false,
                sigFigs: 3,
                penalty: 0.1,
                checkPowerOf10: false,
                powerOf10Penalty: 0.5
            }
        };

        // Type Mapping
        if (type === 'algebraic') part.type = 'algebraic';
        else if (type === 'string') part.type = 'string';
        else if (type === 'matrix') part.type = 'matrix';
        else if (type === 'units') part.type = 'units';
        else if (type === 'radio' || type === 'dropdown') {
            part.type = 'radio';
            // Try to recover MCQ options from variables
            const optVarName = `opt_${name}`;
            const optVar = state.variables.find(v => v.name === optVarName);
            
            if (optVar) {
                try {
                    // Expecting: ["A", "B"]
                    const raw = optVar.value.trim();
                    if (raw.startsWith('[') && raw.endsWith(']')) {
                         const content = raw.slice(1, -1);
                         // Regex to split by comma outside quotes
                         const opts = content.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => {
                             return s.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                         });
                         part.options = opts.map(val => ({ value: val, correct: false }));
                    }
                } catch(e) { console.warn("Failed to parse MCQ options", e); }
                
                // Remove the helper variable
                state.variables = state.variables.filter(v => v !== optVar);
            }
        }

        // 5. Grading Logic (PRT Analysis)
        const prtName = name.replace('ans', 'prt');
        // Find PRT by name tag
        const prt = Array.from(doc.querySelectorAll("prt")).find(p => p.querySelector("name")?.textContent === prtName);

        if (prt) {
             // Check Power of 10
             const fbVars = prt.querySelector("feedbackvariables text")?.textContent || "";
             if (fbVars.includes("is_p10")) {
                 part.grading.checkPowerOf10 = true;
             }

             // Analyze Nodes for Tolerances
             const nodes = prt.querySelectorAll("node");
             nodes.forEach(node => {
                 const testName = node.querySelector("name")?.textContent; // "0", "1", "2"
                 const testType = node.querySelector("answertest")?.textContent;
                 const testOpt = node.querySelector("testoptions")?.textContent;

                 // MCQ Correction
                 if (part.type === 'radio' && testName === '0') {
                     const correctVal = node.querySelector("tans")?.textContent?.replace(/^"|"$/g, '');
                     part.options.forEach(o => {
                         if (o.value === correctVal) o.correct = true;
                     });
                 }

                 // Numerical Grading
                 if (part.type === 'numerical') {
                     if (testType === 'ATNumAbs') {
                         // Node 0 = Wide, Node 1 = Tight
                         if (testName === '0') part.grading.wideTol = parseFloat(testOpt) || 0.2;
                         if (testName === '1') part.grading.tightTol = parseFloat(testOpt) || 0.05;
                     }
                     if (testType === 'ATNumSigFigs') {
                         part.grading.checkSigFigs = true;
                         part.grading.sigFigs = parseInt(testOpt) || 3;
                     }
                 }
                 
                 // Units Grading
                 if (part.type === 'units' && testType === 'ATUnits') {
                     part.grading.tightTol = parseFloat(testOpt) || 0.05;
                 }
             });
        }

        state.parts.push(part);
    });

    // Re-sort parts by ID to ensure order
    state.parts.sort((a,b) => a.id - b.id);

    return state;
}