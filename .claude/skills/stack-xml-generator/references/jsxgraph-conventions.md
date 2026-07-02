# JSXGraph Conventions for STACK Questions — Authoring Reference

## §0 Scope and Cross-Reference

**This file documents STACK platform conventions for authoring JSXGraph
questions by hand:** iframe architecture, input binding APIs, snap
behavior rules, and post-export editing guidance. Written from 7 fix
rounds on Week 13 Q5 (Bounce Diagram) and patterns P-STACK-16 through
P-STACK-21.

**Companion file:** The STACK XML Generator's preset implementations
(what code the generator produces, known limitations, and testing
guidance) are documented in the STACK_XML_Generator repository at:
`docs/jsxgraph-conventions.md`

Read this file to understand STACK platform conventions. Read the
companion file to understand what the generator produces and its gaps.

---

## §1 When to Use JSXGraph

### Decision Criteria for EM&CA Questions

Use JSXGraph when the student answer is spatial or graphical and cannot
be captured by a number, formula, or text input.

**Good fits in EM&CA context:**
- **Phasor diagrams** — student places phasors at correct magnitude and
  angle (e.g., voltage/current phasor relationships in AC circuits)
- **Waveform sketching** — student draws time-domain signals by placing
  control points (e.g., transient response of RC/RL circuits, bounce
  diagrams for transmission lines)
- **Vector drawing** — student draws electric/magnetic field vectors,
  impedance vectors, or force vectors with correct direction and magnitude
- **Circuit topology identification** — student clicks on specific nodes
  or components to identify series/parallel relationships

**Poor fits (overcomplicated by JSXGraph):**
- Single numerical answers (voltage, current, power) → use `numerical`
- Transfer functions, impedance expressions → use `algebraic`
- Component identification from a list → use `radio` (MCQ)
- System of equations → use `matrix`
- Explanation of method → use `notes`

**Rule of thumb:** If the answer can be typed in a box, don't use
JSXGraph. The development and debugging overhead is significant.

---

## Architecture: STACK-JS Sandboxed Iframes

STACK renders `[[jsxgraph]]` blocks inside **sandboxed iframes**. This means:

- JavaScript inside the block runs in a separate DOM context from the parent page
- `document.getElementById()` cannot find STACK input elements (they're in the parent)
- HTML elements defined outside `[[jsxgraph]]...[[/jsxgraph]]` are inaccessible from inside
- The official bridge is `stack_jxg.custom_bind()` which handles iframe-to-parent communication

---

## CAS Variable Syntax

| Syntax | Context | Output |
|--------|---------|--------|
| `{#var#}` | Inside `[[jsxgraph]]` blocks | Raw Maxima value (e.g., `42`) |
| `{@var@}` | HTML outside JSXGraph | LaTeX-rendered (e.g., `\(42\)`) |

**Never use `{@var@}` inside JSXGraph.** It produces `var x = \(42\);` which crashes the JavaScript.

### Concrete wrong-vs-right example

**Wrong (from a real debugging session):**
```javascript
[[jsxgraph input-ref-ans1="ans1Ref" width="500px" height="400px"]]
// Teacher wrote {@Vg@} thinking it would inject the value
var Vg = {@Vg@};  // ← Renders as: var Vg = \(50\); → SyntaxError!
var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-1, Vg+10, 9, -Vg-10],  // ← crashes
// ...
[[/jsxgraph]]
```

**Right:**
```javascript
[[jsxgraph input-ref-ans1="ans1Ref" width="500px" height="400px"]]
var Vg = {#Vg#};  // ← Renders as: var Vg = 50; → works!
var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-1, Vg+10, 9, -Vg-10],  // ← fine
// ...
[[/jsxgraph]]
```

Reference: P-STACK-16.

---

## Input Binding

### Preferred: `stack_jxg.custom_bind()`

```javascript
stack_jxg.custom_bind(
    ans6Ref,           // input reference from input-ref-ans6="ans6Ref"
    serializerFn,      // () => string: graph state → input value
    deserializerFn,    // (string) => void: input value → restore graph
    [syncAnchor]       // watch list: board.update() on these triggers serialization
);
stack_jxg.clear_initial(syncAnchor);  // allow first interaction to trigger save
```

**How it works:**
1. `syncAnchor` is a hidden, fixed JSXGraph point registered as the watch target
2. Any `board.update()` call triggers the serializer via the syncAnchor watcher
3. The deserializer runs on page load if the input already has a saved value
4. Use `board.suspendUpdate()` / `unsuspendUpdate()` in the deserializer to prevent re-entrant serialization

**Why it's preferred:**
- Automatic state restore on page reload (critical for exams)
- Automatic `change` event dispatch (no manual `dispatchEvent` needed)
- Board update events are properly synchronized

Reference: P-STACK-19.

### When manual binding is acceptable

The STACK XML Generator uses manual binding (`getElementById` +
`dispatchEvent`) for its point placement and function sketch presets.
This is because `custom_bind` cannot track objects that are created
dynamically (click-to-create points don't exist at bind time).

The manual approach works correctly but requires explicit state restore
code on page load. For production exams, consider refactoring to the
sync-anchor pattern: create a hidden fixed point as the sync anchor,
bind `custom_bind` to it, and have the serializer/deserializer handle
all dynamic points.

Reference: P-STACK-18, P-STACK-19.

### Fallback: Direct DOM access

For STACK versions without `custom_bind`:

```javascript
var stateInput = (typeof ans6Ref === 'string')
    ? document.getElementById(ans6Ref) : ans6Ref;
```

This handles both old STACK (string ID) and newer STACK (DOM element reference). Wrap `board.update()` to also write to the input.

### Declaring input references

Always declare input references as attributes on the `[[jsxgraph]]` tag:

```html
[[jsxgraph input-ref-ans1="ans1Ref"]]
```

This stores the auto-generated element ID in the JavaScript variable
`ans1Ref`. Never hardcode input IDs — they change across question instances.

Reference: P-STACK-20.

---

## Point Snapping

| Property | Behavior |
|----------|----------|
| `snapToGrid: true` | Snaps to **integer** grid coordinates only — **do not use** |
| `snapSizeX: N` | Snaps x-coordinate to increments of N |
| `snapSizeY: N` | Snaps y-coordinate to increments of N |

**Rule:** Always use `snapSizeX` / `snapSizeY` instead of `snapToGrid`. Set values appropriate for the expected answer precision and grading tolerance.

### Tolerance relationship

**`snapSize` must be ≤ `PRT_tolerance / 2`**

If snap granularity is too coarse, the student cannot place a point close
enough to the expected position even with the correct answer.

### Worked example

For a bounce diagram with voltage tolerance `y_tol = max(1.0, 0.05*Vg)`:

Given `Vg = 50 V`:
- `y_tol = max(1.0, 0.05 * 50) = max(1.0, 2.5) = 2.5`
- `snapSizeY` must be ≤ `2.5 / 2 = 1.25`
- **Use `snapSizeY: 1.0`** (safely within tolerance)
- Or `snapSizeY: 0.25` for finer control

Given `Vg = 10 V`:
- `y_tol = max(1.0, 0.05 * 10) = max(1.0, 0.5) = 1.0`
- `snapSizeY` must be ≤ `1.0 / 2 = 0.5`
- **Use `snapSizeY: 0.5`** (avoids students being unable to reach target)

```javascript
snapSizeX: 1,      // time axis: integer multiples of T
snapSizeY: 0.25    // voltage: 0.25 V increments (well within tolerance)
```

Reference: P-STACK-21.

---

## Display Elements Inside the Iframe

Since the JSXGraph block runs in an iframe, any HTML tables or display elements must be created **dynamically in JavaScript**:

```javascript
var boardDiv = document.getElementById(divid);
var tableWrapper = document.createElement('div');
tableWrapper.innerHTML = '<table>...</table>';
boardDiv.parentNode.insertBefore(tableWrapper, boardDiv.nextSibling);

// Use class+data-attribute selectors (avoids ID collisions across instances)
var cells = tableWrapper.querySelectorAll('.my-class[data-i="0"]');
```

### Alternative: `stack_js` messaging API

For communication between the iframe and the parent page:
```javascript
stack_js.get_content(id)              // read content from parent
stack_js.switch_content(id, newHtml)  // update content in parent
```

**Prefer dynamic DOM creation (option a) for companion HTML** like data
tables, value readouts, and labels. The messaging API is useful when the
HTML already exists in the question text and only needs updating.

Reference: P-STACK-17.

---

## Serialization Format

Serialize points as a Maxima-compatible nested list string:
```javascript
// Output: "[[1,22.5],[3,28.125],[5,29.53],[7,29.88]]"
function serializePoints() {
    var sorted = pts.slice().sort(function(a, b) { return a.X() - b.X(); });
    var parts = [];
    for (var i = 0; i < sorted.length; i++) {
        parts.push('[' + snapVal(sorted[i].X()) + ',' + snapVal(sorted[i].Y()) + ']');
    }
    return '[' + parts.join(',') + ']';
}
```

---

## Hidden Input Configuration

```xml
<input>
    <name>ans6</name>
    <type>algebraic</type>       <!-- NOT string — allows Maxima parsing -->
    <tans>correct_points</tans>  <!-- e.g., [[1,V1],[3,V2],[5,V3],[7,V4]] -->
    <mustverify>0</mustverify>
    <showvalidation>0</showvalidation>
    <options>hideanswer</options>
</input>
```

Place the input in the questiontext with `display:none`:
```html
<p style="display:none">[[input:ans6]] [[validation:ans6]]</p>
```

---

## Grading in PRT Feedbackvariables

Maxima parses `[[1,2],[3,4]]` as `matrix([1,2],[3,4])`, not a nested list. Always convert:

```maxima
student_raw: ans6;
student_pts: if matrixp(student_raw) then args(student_raw) else student_raw;
```

### Nearest-Point Matching (order-independent)

```maxima
x_tol: 0.8;
y_tol: float(max(1.0, 0.05 * Vg));

for ei: 1 thru 4 do (
    for si: 1 thru student_count do (
        if not matched_student[si] then (
            dx: abs(student_pts[si][1] - correct_points[ei][1]),
            dy: abs(student_pts[si][2] - correct_points[ei][2]),
            if is(dx < x_tol) and is(dy < y_tol) then
                /* match found — track it */
        )
    )
);
```

Use the `all_correct` boolean (e.g., `is(num_correct >= 3)`) as the PRT test against `true` with `AlgEquiv`.

---

## §7 Testing Checklist

For any JSXGraph STACK question, verify these concrete actions in Moodle:

1. **Graph renders without errors** — open the question in Moodle preview.
   The JSXGraph board appears with axes, grid, and any preset elements.
   Check browser console for JavaScript errors. **Expected: no errors.**

2. **Submit with correct coordinates** — place all points at the expected
   positions (matching `correct_points`). Submit the quiz attempt.
   **Expected: score = 1.0, feedback table shows all green checks.**

3. **Submit with wrong coordinates** — place points at incorrect positions.
   Submit. **Expected: score = 0, feedback identifies which points failed.**

4. **Submit with partial correct** — place some points correctly and some
   incorrectly. **Expected: score reflects partial credit if PRT supports
   it, or 0 if all-or-nothing.**

5. **Reload page mid-attempt** — place some points, then reload the browser
   page (F5). **Expected: points restore to their last saved positions.**

6. **Submit with wrong point count** — place fewer points than expected.
   Submit. **Expected: score = 0 or partial, feedback mentions missing
   points.**

7. **Reset button** — place several points, click Reset, then submit.
   **Expected: score = 0 (empty answer), all points cleared from graph.**

8. **Order independence** — place correct points in reverse order compared
   to `correct_points` list. **Expected: all points still match (nearest-
   point matching is order-independent).**

9. **Snap precision** — try to place a point at a non-snap position (e.g.,
   between grid lines). **Expected: point snaps to nearest allowed increment.
   Verify the snapped position is within PRT tolerance of the target.**

10. **Multiple question instances** — add the same question twice to a quiz
    (or use it with random variants). Preview both instances. **Expected:
    both graphs work independently, no ID collisions.**

11. **Mobile/tablet touch** — open the question on a touch device. Tap to
    place a point, drag to move it. **Expected: touch interaction works
    (JSXGraph supports touch events natively).**

12. **Validation display** — verify that `[[validation:ansN]]` is hidden
    (`display:none`). Students should not see the raw serialized list
    like `[[10,20],[30,40]]`. **Expected: no visible validation output.**

---

## §8 Generator Gaps

Gaps between the STACK XML Generator's JSXGraph output and the authoring
conventions documented above.

### P-STACK-21: snapToGrid (FIXED)
- **Pattern rule:** Use `snapSizeX`/`snapSizeY` instead of `snapToGrid: true`
- **Generator status:** Fixed in Session 2a. Point placement preset now
  uses `snapSizeX: 1, snapSizeY: 1`.
- **Severity:** Was causing incorrect behavior — students locked to integer
  coordinates even when sub-integer precision was needed.
- **Remaining:** Teachers needing non-integer snap (e.g., 0.25 V steps)
  must edit the generated code after export.

### P-STACK-19: Manual binding in pointPlacement/functionSketch (BY DESIGN)
- **Pattern rule:** Prefer `stack_jxg.custom_bind` for complex state
- **Generator status:** Documented as post-export recommendation. Not a
  bug — `custom_bind` cannot track dynamically created objects.
- **Severity:** Minor. The manual approach works correctly. State restore
  is handled by explicit parse-and-recreate code in the presets.
- **Recommendation:** For production exams where page reload recovery is
  mission-critical, refactor to sync-anchor pattern after export.

### CAS variable injection (BY DESIGN)
- **Pattern rule:** Use `{#var#}` for CAS variables inside graph code
- **Generator status:** The generator inserts `graphCode` verbatim without
  any variable injection. Teachers must manually add `{#var#}` references.
- **Severity:** Minor. Presets use hardcoded values and work without
  CAS variables.

---

## §9 Known Pitfalls

Each entry: Symptom → Root cause → Fix → Reference.

### `{@var@}` renders LaTeX inside JSXGraph
- **Symptom:** Graph fails to render, console shows SyntaxError near
  LaTeX like `\(42\)`
- **Root cause:** `{@var@}` produces LaTeX HTML output, not raw JS values
- **Fix:** Use `{#var#}` inside `[[jsxgraph]]` blocks
- **Reference:** P-STACK-16

### External DOM access returns null
- **Symptom:** `getElementById('my-table')` returns null despite element
  existing in question text HTML
- **Root cause:** JSXGraph runs in sandboxed IFRAME — separate DOM context
- **Fix:** Create HTML dynamically inside block, or use `stack_js` API
- **Reference:** P-STACK-17

### Hidden input value not submitted to Moodle
- **Symptom:** Student interacts with graph, submits, but gets 0 marks.
  PRT shows empty student answer.
- **Root cause:** `.value` was set but no `change` event dispatched —
  IFRAME-to-VLE sync not triggered
- **Fix:** `element.dispatchEvent(new Event('change'))` after `.value = ...`,
  or use `custom_bind` (handles automatically)
- **Reference:** P-STACK-18

### State lost on page reload
- **Symptom:** Student places points, reloads page, points disappear
- **Root cause:** Manual binding without restore logic, or `custom_bind`
  without proper deserializer
- **Fix:** Implement deserializer that parses saved input value and
  re-creates points. Use `board.suspendUpdate()` in deserializer.
- **Reference:** P-STACK-19

### Hardcoded input IDs break with multiple instances
- **Symptom:** First question instance works, second shows broken graph
  or submits to wrong input
- **Root cause:** IDs like `getElementById('ans1')` collide across
  question instances in a quiz
- **Fix:** Declare `input-ref-ansN="varRef"` on `[[jsxgraph]]` tag, use
  the variable instead of hardcoded strings
- **Reference:** P-STACK-20

### Snap too coarse for answer precision
- **Symptom:** Student knows the correct value (e.g., 28.125 V) but
  cannot place point there — it jumps to 28 or 29
- **Root cause:** `snapToGrid: true` or `snapSizeY` larger than tolerance
- **Fix:** Set `snapSizeY` ≤ `PRT_tolerance / 2`. See §Point Snapping
  for worked examples.
- **Reference:** P-STACK-21

---

## Last Updated
2026-04-07 — Session 2a: added §0, §1, §7 (expanded), §8, §9; expanded
variable syntax with concrete example; added tolerance relationship
calculation; documented generator gaps and manual binding rationale.
