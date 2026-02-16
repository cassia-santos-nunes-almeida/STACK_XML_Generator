# STACK XML Question Generator for Moodle

A browser-based tool for building [STACK](https://stack-assessment.org/) question XML files that can be imported directly into Moodle 4.5.

Build randomised maths and engineering questions with variables, multiple input types, multi-step grading pipelines, and instant preview — no Moodle access required.

## Features

- **7 input types** — Numerical, Algebraic, Units, Multiple Choice, Matrix, Text/String, Interactive Graph (JSXGraph)
- **Notes/Reasoning parts** — Free-text explanation boxes with optional handwritten working upload (image attachments), supporting both auto-credit and manual teacher grading
- **Maxima variables** — Define randomised parameters with `rand()`, `rand_with_step()`, expressions, and computed answers
- **Grading pipeline** — Wide/tight tolerance, significant figures check, power-of-10 detection with configurable penalties
- **Live preview** — See variable substitution and MathJax-rendered maths as you type, with validation warnings
- **JSXGraph support** — Point placement, function sketching, and vector drawing presets with server-side Maxima grading
- **Import/Export** — Save as JSON for editing later, or download Moodle-ready XML; import existing STACK XML files back into the editor
- **Templates** — Pre-built question templates for common engineering, physics, and maths scenarios
- **Images** — Drag-and-drop image upload, base64-embedded in the XML
- **Hints & Feedback** — General feedback (worked solutions), per-part custom feedback, multi-attempt hints
- **Part prerequisites** — Require students to answer earlier parts correctly before unlocking later ones

## Run Locally

**Prerequisites:** Node.js (v18+)

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Run tests (160+ tests)
npm test

# Watch mode
npm run test:watch

# Build for production
npm run build
```

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to `main`.

### Setup

1. Go to your repository **Settings > Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` — the workflow at `.github/workflows/deploy.yml` will build and deploy automatically

> **Note:** The `base` path in `vite.config.ts` is set to `/STACK_XML_Generator/`. If you rename the repository, update this value to match.

## Project Structure

```
src/
  index.html              Entry point
  css/styles.css          All styles
  core/
    state.js              Centralised state manager (observer pattern)
    constants.js          Input types, grading presets, answer tests
    validators.js         Pre-export validation rules
  generators/
    xml-generator.js      Main orchestrator
    question-header.js    Name, text, images, feedback, hints
    question-variables.js Maxima questionvariables block
    inputs/               One generator per input type (7 files)
    prts/                 One PRT generator per answer type (8 files)
    xml-helpers.js        CDATA, escaping, math delimiter conversion
  parsers/
    xml-parser.js         Import existing STACK XML back into editor
    variable-parser.js    Evaluate preview values for live substitution
  templates/              Pre-built question templates
  ui/
    app.js                App init and event wiring
    ui-manager.js         Coordinates rendering and user interaction
    render-parts.js       Part editor (inputs, grading, feedback)
    render-preview.js     Live preview with variable substitution
    render-variables.js   Variable editor rows
    render-toolbar.js     Formatting and variable-insert toolbar
    render-general.js     Images, feedback editor, hints
  tests/                  Vitest test suite (160+ tests)
```

## Usage

1. **Name** your question and optionally set default grade and penalty
2. **Add variables** — use Maxima expressions like `rand(10)`, `a + b`, `integrate(x^2, x)`
3. **Write question text** — reference variables with `{@varName@}`, use `\( \)` for inline maths
4. **Add parts** — choose input type, set the answer variable, configure grading tolerances
5. **Preview** — check the live preview panel on the right; click "Generate Sample Values" to re-roll randoms
6. **Export** — click "Download Moodle XML" and import the file into Moodle via the question bank

### Notes on Image Upload Parts

When using the **Notes/Reasoning** input type with image upload enabled, keep in mind:

- Students will be asked to photograph or scan their handwritten working and attach it
- **Moodle configuration required:** You must enable "Allow attachments" in your Moodle quiz settings for the file upload area to appear
- Uploaded images and written explanations are **not auto-marked** — the teacher must review and grade them manually

## License

MIT
