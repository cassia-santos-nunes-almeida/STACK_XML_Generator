# JSXGraph Conventions — Generator Implementation Reference

## §0 Scope and Cross-Reference

**This file documents the STACK XML Generator's JSXGraph implementation:**
what presets exist, what XML they produce, known limitations, and how to
use the generated output in Moodle.

**Companion file:** The STACK authoring conventions (how to write JSXGraph
questions by hand, iframe architecture, `custom_bind` API details, and
manual post-export editing guidance) live in the EM-AC-STACK-Assessments
repository at:
`.claude/skill/stack-xml-generator/references/jsxgraph-conventions.md`

Read this file to understand the generator. Read the companion file to
understand the STACK platform conventions the generator targets.

---

## §1 When to Use JSXGraph

### Decision Criteria for EM&CA Questions

JSXGraph is appropriate when the student answer is **spatial or graphical**
and cannot be expressed as a single number, formula, or text string.

**Good fits:**
- **Phasor diagram point placement** — student places voltage/current
  phasors at correct magnitude and angle on a polar or Cartesian grid
- **Waveform sketching** — student draws a time-domain signal by placing
  control points (e.g., transient response of an RC circuit)
- **Vector drawing** — student draws a force vector, electric field vector,
  or impedance vector with correct direction and magnitude
- **Circuit node identification** — student clicks on nodes to identify
  them (combined with point placement grading)

**Poor fits (use other input types instead):**
- Single numerical answer (voltage, current, power) → use `numerical`
- Algebraic expression (transfer function, impedance formula) → use
  `algebraic`
- Component selection (which resistor is in series?) → use `radio` (MCQ)
- Matrix answer (node-voltage equations) → use `matrix`
- Explanation of reasoning → use `notes`

**Rule of thumb:** If the answer can be typed, don't use JSXGraph.

---

## §2 Generator Presets

The generator supports three presets defined in `src/generators/graph-presets.js`.
Each preset generates both client-side JavaScript (graph setup) and server-side
Maxima (grading logic).

### 2.1 Point Placement

**What the student sees:** A coordinate grid. Clicking places a point (up to
`maxPoints`). Points are draggable. A "Reset" button clears all points.
Points are connected by line segments in placement order.

**What Maxima receives:** A nested list like `[[10,20],[30,40],[50,60]]`.
Maxima parses this as `matrix([10,20],[30,40],[50,60])`.

**Maxima output variables:**
- `student_raw` (matrix) — raw student input
- `student_pts` (list of lists) — converted via `args()`
- `num_correct` (integer) — count of matched points
- `all_correct` (boolean) — `true` if all expected points matched
- `feedback_msg` (string) — HTML comparison table

**Required teacher variable:** `correct_points` — a list of `[x,y]` pairs
defined in Question Variables, e.g. `correct_points: [[10,20],[30,40]];`

**Key XML sections generated:**

Question text (jsxgraph block):
```html
[[jsxgraph input-ref-ans1="ans1Ref" width="500px" height="400px"]]
var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-5, 70, 65, -70],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});
// ... point creation with snapSizeX: 1, snapSizeY: 1
// ... serialize to Maxima list format
// ... dispatch change event on hidden input
[[/jsxgraph]]
```

Hidden input (display:none):
```html
<p style="display:none">[[input:ans1]] [[validation:ans1]]</p>
```

Input element:
```xml
<input>
  <name>ans1</name>
  <type>algebraic</type>
  <tans>ans1</tans>
  <mustverify>0</mustverify>
  <showvalidation>0</showvalidation>
  <options>hideanswer</options>
</input>
```

PRT grading (feedbackvariables):
```maxima
student_raw: ans1;
student_pts: if matrixp(student_raw) then args(student_raw) else student_raw;
/* Nearest-point matching (order-independent) */
/* Sets all_correct and builds feedback_msg HTML table */
```

**Known limitations:**
- Uses manual DOM binding (`getElementById` + `dispatchEvent`) instead of
  `stack_jxg.custom_bind`. This works correctly but does not get automatic
  state restore on page reload — the preset includes manual restore code
  that parses the saved input value. **Post-export recommendation:** for
  production exams, consider refactoring to `custom_bind` (see companion
  conventions file §Input Binding).
- Snap granularity is fixed at integer coordinates (`snapSizeX: 1,
  snapSizeY: 1`). For sub-integer precision (e.g., voltage in 0.25 V
  steps), edit the generated code after export. Ensure snap granularity
  is ≤ PRT tolerance / 2.

### 2.2 Function Sketch

**What the student sees:** A coordinate grid. Clicking places control
points. A spline curve is drawn through all points. Points are draggable.

**What Maxima receives:** A nested list like `[[0,2.0],[2.5,4.0],[5.0,3.0]]`.
Coordinates snap to 0.5 increments (hardcoded in the preset).

**Maxima output variables:**
- `student_raw`, `student_pts` — same conversion as point placement
- `num_correct` (integer) — count of Y-values within tolerance
- `all_correct` (boolean) — `true` if ≥ 80% of points match
- `feedback_msg` (string) — HTML table comparing expected vs actual Y

**Required teacher variable:** `expected_y` — a list of expected Y-values
at each control point position, e.g. `expected_y: [0, 2, 4, 3, 1];`

**Known limitations:**
- Uses manual DOM binding (same recommendation as point placement)
- The 80% pass threshold is hardcoded in the grading template. To change
  it, edit the generated Maxima code after export.
- No limit on number of points (unlike point placement). The grading
  compares only the first `length(expected_y)` points.

### 2.3 Vector Drawing

**What the student sees:** Two draggable points (Start and End) connected
by an arrow. The student positions both to define a vector.

**What Maxima receives:** A flat list `[startX, startY, endX, endY]`.

**Maxima output variables:**
- `dx_student`, `dy_student` — computed vector components
- `dx_ok`, `dy_ok` (boolean) — per-component tolerance checks
- `all_correct` (boolean) — `dx_ok and dy_ok`
- `feedback_msg` (string) — HTML table comparing components

**Required teacher variable:** `expected_vector` — `[dx, dy]` pair,
e.g. `expected_vector: [3, 4];`

**Key difference from other presets:** This preset uses
`stack_jxg.custom_bind()` for input binding, which automatically handles
state restore on page reload and change event dispatch.

**Known limitations:**
- Only supports a single vector. For multiple vectors, use custom code.
- No snap behavior configured — points can be placed at any coordinate.

---

## §3 Variable Injection

Inside `[[jsxgraph]]` blocks, CAS variables must use `{#var#}` syntax.
The `{@var@}` syntax renders LaTeX HTML, which breaks JavaScript.

**Wrong (causes JavaScript syntax error):**
```javascript
// Generated output if teacher writes {@Vmax@} in graph code:
var maxVoltage = \(42\);  // ← LaTeX, not a number!
```

**Right (raw numeric value injected):**
```javascript
// Teacher should use {#Vmax#} in graph code:
var maxVoltage = 42;  // ← plain number, works in JS
```

**Generator behavior:** The generator does NOT inject CAS variables into
graph code automatically. The `graphCode` field is inserted verbatim into
the `[[jsxgraph]]` block. Teachers who need randomized graph parameters
must manually add `{#var#}` references in their custom graph code.

The presets do not use any CAS variables — they use hardcoded values.
To randomize preset parameters (e.g., bounding box, tolerance), edit the
generated code after export.

Reference: P-STACK-16.

---

## §4 Input Binding

The generator produces `[[jsxgraph input-ref-ansN="ansNRef"]]` on the
jsxgraph tag (see `question-header.js` line 30). This declares the
input reference variable used inside the JavaScript block.

### What the generator produces

**Point placement and function sketch** — manual binding:
```javascript
var stateInput = document.getElementById(ans1Ref);
// ... update stateInput.value with serialized points ...
stateInput.dispatchEvent(new Event('change'));
```

**Vector drawing** — `stack_jxg.custom_bind`:
```javascript
stack_jxg.custom_bind(ans1Ref, function() {
    return '[' + startPt.X().toFixed(1) + ',' + startPt.Y().toFixed(1) + ',' +
                 endPt.X().toFixed(1) + ',' + endPt.Y().toFixed(1) + ']';
}, function(data) {
    // deserialize and restore point positions
}, [startPt, endPt]);
```

### When to use each approach

| Approach | When | Why |
|----------|------|-----|
| `stack_jxg.custom_bind` | Fixed number of objects (vector endpoints, sliders) | Automatic state restore, event dispatch, board sync |
| Manual `getElementById` | Dynamic objects (click-to-create points) | `custom_bind` can't track objects that don't exist at bind time |

**Post-export recommendation:** For production exams where page reload
recovery is critical, consider refactoring manual binding to use a
`custom_bind` with a sync anchor pattern (see companion conventions file).

Reference: P-STACK-18, P-STACK-19, P-STACK-20.

---

## §5 State and Lifecycle

### Reload/Restore

Both binding approaches include state restore logic:

- **Manual binding (point placement, function sketch):** On page load, the
  preset checks `stateInput.value`. If non-empty and not `'[]'`, it parses
  the saved value with regex and re-creates the points at saved coordinates.

- **`custom_bind` (vector drawing):** The deserializer function runs
  automatically when the page loads and the input has a saved value.
  It calls `moveTo()` on existing points to restore positions.

### IFRAME Isolation

JSXGraph code runs in a sandboxed IFRAME. Consequences:

- Cannot access DOM elements outside `[[jsxgraph]]...[[/jsxgraph]]`
- Cannot read question text HTML elements (tables, labels, spans)
- The `divid` variable refers to the board container inside the IFRAME

**Creating companion HTML (tables, labels) inside the block:**
```javascript
var boardDiv = document.getElementById(divid);
var wrapper = document.createElement('div');
wrapper.innerHTML = '<table>...</table>';
boardDiv.parentNode.insertBefore(wrapper, boardDiv.nextSibling);
```

**Alternative: `stack_js` messaging API** for cross-iframe communication
(see companion conventions file for details).

Reference: P-STACK-17.

---

## §6 Snap Behavior and Grading Tolerance

### snapSizeX/Y vs snapToGrid

| Property | Behavior |
|----------|----------|
| `snapToGrid: true` | Snaps to integer coordinates only — **do not use** |
| `snapSizeX: N` | Snaps x-coordinate to multiples of N |
| `snapSizeY: N` | Snaps y-coordinate to multiples of N |

The generator's point placement preset uses `snapSizeX: 1, snapSizeY: 1`
(integer snapping). This was fixed from `snapToGrid: true` in Session 2a.

### Tolerance Relationship

The snap granularity must be fine enough that the student can place a point
within the PRT grading tolerance. Rule:

**`snapSize ≤ PRT_tolerance / 2`**

Example calculation for a voltage waveform question:
- PRT tolerance: `y_tol = max(1.0, 0.05 * Vg)` where `Vg = 50V`
- → `y_tol = max(1.0, 2.5) = 2.5`
- → `snapSizeY` must be ≤ `2.5 / 2 = 1.25`
- → Use `snapSizeY: 1.0` or `snapSizeY: 0.5`

If `snapSizeY` is too large relative to tolerance, the student may be
unable to place a point close enough to the expected position even when
they know the correct answer.

Reference: P-STACK-21.

---

## §7 Testing Checklist

For any JSXGraph question generated by this tool, verify the following
in Moodle after import:

1. **Graph renders** — the JSXGraph board appears with axes, grid, and
   any preset elements (points, arrows). No JavaScript console errors.

2. **Interaction works** — clicking/dragging creates or moves points
   as expected. The point count limit is enforced (point placement).

3. **Snap behavior correct** — points snap to the configured increment,
   not to integer-only grid coordinates.

4. **Reset button works** — clicking Reset clears all student-placed
   points and resets the hidden input to `[]`.

5. **Submit with correct coordinates** — place points at the expected
   positions. Submit. Verify score = 1.0 and feedback shows all checks
   passed.

6. **Submit with wrong coordinates** — place points at incorrect positions.
   Submit. Verify score = 0 and feedback table shows which points failed.

7. **Reload page mid-attempt** — place some points, reload the page.
   Verify points restore to their last saved positions (or to the positions
   at last `change` event dispatch).

8. **Submit with wrong count** — place fewer points than expected. Submit.
   Verify score reflects partial or zero credit and feedback identifies
   missing points.

9. **Order independence** — place correct points in a different order
   than the `correct_points` list. Verify all points still match
   (point placement uses nearest-point matching).

10. **Preview in question bank** — open the question in Moodle's question
    bank preview. Verify the graph loads and the hidden input is not
    visible to students.

---

## §8 Generator Gaps

Formalized from the Session 2a gap analysis.

### P-STACK-21: snapToGrid → snapSizeX/Y
- **Severity:** Causes incorrect behavior — students locked to integer
  coordinates even when sub-integer precision needed
- **Status:** Fixed in Session 2a. Point placement preset now uses
  `snapSizeX: 1, snapSizeY: 1`.
- **Remaining action:** Teachers needing non-integer snap (e.g., 0.25 V
  steps) must edit the generated code after export.

### P-STACK-19: Manual binding in pointPlacement and functionSketch
- **Severity:** Minor — works correctly but misses automatic state
  restore guarantees of `custom_bind`
- **Status:** Documented as post-export recommendation. Not a bug —
  `custom_bind` cannot track dynamically created objects. The presets
  include manual restore code that handles page reload.
- **Remaining action:** None required. Teachers may optionally refactor
  to sync-anchor pattern for production exams.

### CAS variable injection not automated
- **Severity:** Minor — teacher must manually add `{#var#}` references
- **Status:** By design. The generator inserts `graphCode` verbatim.
- **Remaining action:** Document in checklist (done in §7 via companion
  file reference).

---

## §9 Known Pitfalls

### Pitfall 1: `{@var@}` inside JSXGraph blocks
- **Symptom:** Graph fails to render, JavaScript console shows syntax
  error near LaTeX output like `\(42\)`
- **Root cause:** `{@var@}` renders LaTeX HTML, not raw values
- **Fix:** Replace with `{#var#}` inside `[[jsxgraph]]` blocks
- **Reference:** P-STACK-16

### Pitfall 2: Accessing external DOM from inside JSXGraph block
- **Symptom:** `document.getElementById('my-table')` returns `null`
  even though the element exists in question text
- **Root cause:** JSXGraph runs in a sandboxed IFRAME — different DOM
- **Fix:** Create HTML dynamically inside the block, or use `stack_js`
  messaging API
- **Reference:** P-STACK-17

### Pitfall 3: Hidden input value not submitted
- **Symptom:** Student interacts with graph but Moodle receives empty
  answer — PRT gives 0 marks
- **Root cause:** Value written to input element but no `change` event
  dispatched — IFRAME-to-VLE sync not triggered
- **Fix:** Call `element.dispatchEvent(new Event('change'))` after
  setting `.value`, or use `stack_jxg.custom_bind` which handles this
- **Reference:** P-STACK-18

### Pitfall 4: Hardcoded input element IDs
- **Symptom:** Graph works in preview but breaks when multiple instances
  of the same question appear (e.g., in a quiz with variants)
- **Root cause:** Hardcoded IDs like `document.getElementById('ans1')`
  collide across instances
- **Fix:** Declare `input-ref-ansN="varName"` on the `[[jsxgraph]]` tag
  and use the variable: `document.getElementById(varName)`
- **Reference:** P-STACK-20

### Pitfall 5: `snapToGrid: true` too coarse
- **Symptom:** Students cannot place points at fractional coordinates
  (e.g., 28.125 V) — points jump to nearest integer
- **Root cause:** `snapToGrid: true` locks to integer grid
- **Fix:** Use `snapSizeX: N, snapSizeY: N` with appropriate increment
- **Reference:** P-STACK-21

### Pitfall 6: Indexing student answer as list when Maxima parsed it as matrix
- **Symptom:** Grading code crashes with "wrong type argument" when
  accessing `student_pts[1][1]`
- **Root cause:** Maxima parses `[[1,2],[3,4]]` as
  `matrix([1,2],[3,4])`, not a nested list. Matrix indexing differs.
- **Fix:** Convert with `args()`:
  `student_pts: if matrixp(student_raw) then args(student_raw) else student_raw;`
- **Reference:** Grading templates in `graph-presets.js`
