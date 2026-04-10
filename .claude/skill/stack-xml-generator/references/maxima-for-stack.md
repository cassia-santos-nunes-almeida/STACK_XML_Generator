# Maxima for STACK -- Quick Reference

Reference for Maxima commands used in STACK question authoring.
Organized by category, with STACK-specific behavior noted where it
diverges from standalone Maxima. Engineering education context
throughout (circuit analysis, EM fields).

---

## §1 Constants and Operators

| Constant | Maxima syntax | Notes |
|----------|--------------|-------|
| Euler's number *e* | `%e` | `%e^2`, `exp(2)` both valid |
| Pi | `%pi` | Use exact: `4*%pi/10^7` not `4*%pi*1e-7` |
| Imaginary unit *i* | `%i` | STACK also allows `j` with alias in questionvariables |

| Operation | Syntax | Example |
|-----------|--------|---------|
| Assignment | `:` | `R1: 100;` |
| Function definition | `:=` | `f(x) := x^2 + 1;` |
| Equation (not assignment) | `=` | `eqn: V = I*R;` |
| Multiplication | `*` | `2*%pi*f` |
| Power | `^` or `**` | `x^2`, `x**2` |
| Square root | `sqrt(x)` | Returns exact form, not float |
| Magnitude | `abs(x)` | Works on complex: `abs(1+%i)` gives `sqrt(2)` |
| Factorial | `!` or `factorial` | `5!`, `factorial(5)` |

### Arithmetic Caution

Use exact rational arithmetic for symbolic constants. Floats cause
`AlgEquiv` failures on expressions involving `%pi`, `%e`, or surds.

```maxima
/* Correct -- exact */
mu0: 4*%pi/10^7;

/* Wrong -- float contaminates the expression */
mu0: 4*%pi*1e-7;
```

---

## §2 Algebraic Manipulation

| Operation | Command | Example |
|-----------|---------|---------|
| Expand brackets | `expand(expr)` | `expand((x+y)^2)` |
| Factorise | `factor(expr)` | `factor(x^2+2*x+1)` |
| Simplify rational | `fullratsimp(expr)` | `fullratsimp((x^2+2*x^2)/x)` |
| Numerator | `num(expr)` | `num(x/(x+2))` |
| Denominator | `denom(expr)` | `denom(x/(x+2))` |
| Simplify exp/log | `radcan(expr)` | `radcan(log(2*x^3))` |
| Combine logs | `logcontract(expr)` | `logcontract(log(a)+log(b))` |
| Left side of equation | `lhs(eqn)` | `lhs(2*x+3 = x-4)` |
| Right side of equation | `rhs(eqn)` | `rhs(2*x+3 = x-4)` |
| Substitute | `subst(val, var, expr)` | `subst(4, x, x^2)` gives 16 |
| Solve for variable | `solve(eqn, var)` | `solve(2*a*x-3 = 0, x)` |
| Solve system | `solve([eqns], [vars])` | `solve([x+y=3, 2*x-y=0], [x,y])` |
| Complete the square | `comp_square(expr, var)` | `comp_square(x^2+2*x, x)` (STACK) |

---

## §3 Calculus

| Operation | Command | Example |
|-----------|---------|---------|
| Differentiate | `diff(expr, var)` | `diff(cos(x^2), x)` |
| Differentiate *n* times | `diff(expr, var, n)` | `diff(sin(x), x, 2)` |
| Indefinite integral | `integrate(expr, var)` | `integrate(x^3, x)` |
| Definite integral | `integrate(expr, var, a, b)` | `integrate(x^2, x, 0, 1)` |

STACK's `Int` answer test handles integration constants automatically
when the `NOCONT` option is not used. See answer-tests-and-inputs.md §3.

---

## §4 Trigonometry and Logarithms

### Trigonometric Functions

| Function | Maxima | Inverse |
|----------|--------|---------|
| sin, cos, tan | `sin(x)`, `cos(x)`, `tan(x)` | `asin(x)`, `acos(x)`, `atan(x)` |
| csc, sec, cot | `csc(x)`, `sec(x)`, `cot(x)` | -- |
| sinh, cosh, tanh | `sinh(x)`, `cosh(x)`, `tanh(x)` | `asinh(x)`, `acosh(x)`, `atanh(x)` |

All trig arguments are in **radians**. There is no degree mode in STACK.

### Trig Manipulation

| Operation | Command |
|-----------|---------|
| Expand trig (sums/multiples) | `trigexpand(sin(A+B))` |
| Reduce powers to multiples | `trigreduce(sin(x)^2)` |
| Simplify trig identities | `trigsimp(sin(x)^2 + cos(x)^2)` |
| Simplify rational trig | `trigrat(sin(2*x)/sin(x))` |

### Logarithms

STACK displays `log(x)` as ln(*x*) by default. Both `log(x)` and
`ln(x)` work in question variables, but `log` is the canonical Maxima
form.

To display as log_e(*x*) for engineering contexts, use `texput`
(see §7).

---

## §5 Lists, Sets, and Matrices

### Lists

Ordered, may contain duplicates. Delimited by `[...]`.

| Operation | Command | Example |
|-----------|---------|---------|
| Create | `L: [1,2,3,5]` | |
| Length | `length(L)` | 4 |
| Access element | `L[3]` | 3 (1-indexed) |
| Generate with formula | `makelist(2*n, n, 1, 100)` | `[2, 4, 6, ..., 200]` |
| Append | `append(L1, L2)` | Concatenates two lists |
| Apply function | `map(f, L)` | `map(sin, [0, %pi/2])` gives `[0, 1]` |

### Sets

Unordered, no duplicates. Delimited by `{...}`.

| Operation | Command | Example |
|-----------|---------|---------|
| Create | `S: {1, 3, 5}` | |
| Number of elements | `length(S)` | 3 |
| List to set | `setify(L)` | Removes duplicates, unorders |
| Set to list | `listify(S)` | Ordered list from set |
| Union / intersection | `union(S1,S2)`, `intersection(S1,S2)` | |

### Matrices

| Operation | Command | Example |
|-----------|---------|---------|
| Create | `matrix([row1], [row2])` | `A: matrix([1,2],[3,4])` |
| Size | `matrix_size(A)` | `[2, 2]` |
| Access row | `A[2]` | `[3, 4]` |
| Access element | `A[2][1]` or `A[2,1]` | 3 |
| Add / subtract | `A + B`, `A - B` | Element-wise |
| Scalar multiply | `k * A` | `2 * A` |
| Matrix multiply | `A . B` | Dot operator, not `*` |
| Matrix power | `A ^^ n` | `A ^^ 3` (not `A^3`) |
| Transpose | `transpose(A)` | |
| Determinant | `determinant(A)` | |
| Inverse | `invert(A)` or `A^^(-1)` | |

**Parsing pitfall:** Maxima parses `[[1,2],[3,4]]` as
`matrix([1,2],[3,4])`, not a nested list. When grading JSXGraph
point lists, convert with `args()`:

```maxima
student_pts: if matrixp(ans6) then args(ans6) else ans6;
```

Cross-reference: jsxgraph-conventions.md §Grading.

---

## §6 Simplification Control

Maxima simplifies expressions automatically by default. STACK provides
two levels of control: question-level simplify (XML option) and inline
toggling within CAS code.

### Inline Toggle

```maxima
/* Compute answers with simplification ON (default) */
ans_exact: V/R;
ans_float: float(ans_exact);

/* Turn OFF for display variables (worked solutions) */
simp: false;
work_step1: V/R;
work_step2: ans_float;
```

Everything assigned after `simp: false` keeps its unsimplified form.
This is how you show `V/R` in the worked solution instead of the
computed number.

### Force-Simplify One Expression

When simplification is off globally, force a single evaluation:

```maxima
simp: false;
display_expr: x*x + x*x*x;
simplified_val: ev(display_expr, simp);
/* display_expr stays unsimplified; simplified_val = x^2 + x^3 */
```

### Question-Level vs PRT Auto-Simplify

| Setting | XML tag | Effect |
|---------|---------|--------|
| Question-level simplify | `<questionsimplify>1</questionsimplify>` | Controls `simp` during questionvariables evaluation |
| PRT auto-simplify | `<autosimplify>1</autosimplify>` inside `<prt>` | Controls `simp` during feedbackvariables and node evaluation |

Turn PRT auto-simplify **off** when testing whether the student
collected terms or expanded fully (e.g., with the `Expanded` or
`FacForm` answer tests).

### Ordering

| Command | Effect | Use case |
|---------|--------|----------|
| `ordergreat(x)` | Display *x* before other variables | Show `x + y` not `y + x` |
| `powerdisp: true` | Display in increasing power order | Show `1 + x + x^2` not `x^2 + x + 1` |

---

## §7 Display Customization (texput)

`texput` changes how Maxima renders a function or variable in LaTeX
output (`{@var@}` in question text). Place these commands in
`<questionvariables>`.

### Syntax

```maxima
texput(function_name, "latex_string", type);
```

The `type` argument controls where the LaTeX string appears relative
to the argument:

| Type | Meaning | Example use |
|------|---------|-------------|
| `prefix` | Before the argument: `\mathrm{f}(x)` | Functions, named operators |
| `infix` | Between two arguments: `a \cdot b` | Binary operators |
| `postfix` | After the argument: `x!` | Postfix notation |
| `nary` | Between two or more arguments | n-ary operators like `+` |
| `nofix` | No argument (constant display) | Constants |
| `matchfix` | Surrounding symbols: `\langle x \rangle` | Brackets, norms |

### Worked Example: Engineering Log Notation

STACK displays `log(x)` as ln(*x*). To show log_e(*x*) instead:

```maxima
texput(log, "\\mathrm{log}_e", prefix);
```

After this, `{@log(omega*L/R)@}` renders as
\(\mathrm{log}_e(\omega L / R)\) in the question text.

### Worked Example: Custom Unit Display

```maxima
/* Display mu_r as a subscripted symbol */
texput(mur, "\\mu_r");
```

Note the double backslash -- Maxima strings need `\\` for a single
LaTeX backslash because `\m` would be interpreted as an escape.

---

## §8 STACK-Specific Commands

These commands are provided by STACK and are not available in
standalone Maxima.

### Randomization

| Command | What it does | Example |
|---------|-------------|---------|
| `rand(n)` | Random integer 0 to *n*-1 | `rand(10)` gives 0--9 |
| `rand(list)` | Random element from list | `rand([1,2,3])` |
| `rand_with_prohib(lo, hi, excl)` | Random integer in [lo,hi] excluding list | `rand_with_prohib(-9, 9, [-1,0,1])` |
| `rand_with_step(lo, hi, step)` | Random from lo to hi in steps | `rand_with_step(2, 10, 2)` gives 2,4,6,8,10 |

`rand_with_prohib` is documented in the 2019 STACK Guide.
`rand_with_step` is a later STACK addition, widely used for
engineering parameter ranges.

### Algebraic

| Command | What it does | Example |
|---------|-------------|---------|
| `comp_square(expr, var)` | Complete the square | `comp_square(x^2+6*x+7, x)` gives `(x+3)^2-2` |
| `exdowncase(expr)` | Force all variables lowercase | `exdowncase(X+Y+z)` gives `x+y+z` |

### Numerical Display

| Command | What it does | Example |
|---------|-------------|---------|
| `decimalplaces(x, d)` | Round to *d* decimal places | `decimalplaces(1.2345, 2)` gives 1.23 |
| `significantfigures(x, s)` | Round to *s* sig figs | `significantfigures(0.001234, 2)` gives 0.0012 |
| `dispdp(x, d)` | Display with *d* d.p. (trailing zeros) | `dispdp(1.2, 4)` shows 1.2000 |
| `dispsf(x, s)` | Display with *s* sig figs (trailing zeros) | `dispsf(1.2, 3)` shows 1.20 |
| `scientific_notation(x, n)` | Display in scientific notation | `scientific_notation(1234, 2)` shows 1.23 x 10^3 |

**Banker's rounding warning:** Maxima uses banker's rounding by
default. `round(2.5)` gives 2, not 3. If you need conventional
rounding, use `ceiling` or a custom function.

### Utility

| Command | What it does | Example |
|---------|-------------|---------|
| `stack_var_makelist(k, 5)` | Create numbered variables k0..k4 | Returns list `[k0, k1, k2, k3, k4]` |
| `stack_disp_comma_separate(L)` | Display list without brackets | `stack_disp_comma_separate([1,2,3])` renders as `1, 2, 3` |
| `stack_disp_fractions(mode)` | Control fraction rendering | `"displayed"` (LaTeX `\frac`), `"inline"` (solidus `/`), `"negpow"` (negative exponents) |
| `castext("string")` | Create reusable CASText object | Embed CAS-evaluated text inside questionvariables for reuse |
| `castext_concat(a, b)` | Join CASText objects | Concatenate two `castext()` outputs |

`stack_var_makelist` is useful for generating component-indexed
variables (e.g., `R0, R1, R2` for a circuit with multiple resistors)
without using `concat` and `parse_string`.

`stack_disp_fractions` is placed in questionvariables and affects the
entire question. Use `"negpow"` for engineering contexts where
negative exponents are standard (e.g., `m*s^{-1}` instead of `m/s`).

### Variable Naming Restrictions

STACK imposes constraints on variable names that differ from
standalone Maxima:

- Variables defined in `<questionvariables>` are **automatically
  forbidden** in student input. If you define `R1`, students cannot
  type `R1` as part of their answer (it will be flagged as invalid).
  This is why multi-character variable names are preferred -- it
  prevents students from accidentally entering a variable that
  evaluates to the answer.

- In `<feedbackvariables>`, never redefine input variable names. If
  the student input is `ans1`, do not write `ans1: something_else` in
  feedbackvariables. Use a new name like `ansmod1` instead. Redefining
  the input bypasses certain answer test behaviors.

### Context Variables (Preamble)

Variables defined before a `%_stack_preamble_end` marker in
questionvariables become "context variables" available during student
input validation. This is where to place:

- `assume(a > 0)` -- affects simplification during validation
- `declare(n, integer)` -- type declarations
- `ordergreat(x)`, `orderless(y)` -- display ordering (each allowed once)
- `texput(...)` definitions -- custom LaTeX rendering

```maxima
assume(omega > 0);
declare(n, integer);
texput(log, "\\mathrm{log}_e", prefix);
%_stack_preamble_end;

/* Regular question variables below */
R1: rand_with_step(10, 100, 10);
```

---

## §9 Randomization Patterns

### Constrained Parameter Ranges

Pick ranges that avoid degenerate cases (division by zero, negative
under square root, zero-valued answers that break `NumRelative`):

```maxima
/* Resistance values: always positive, reasonable range */
R1: rand_with_step(10, 100, 10);
R2: rand_with_step(10, 100, 10);

/* Ensure R1 != R2 for parallel combination problems */
R2: rand_with_prohib(10, 100, [R1]);
/* But this gives any integer -- better to use a curated list: */
R2: rand(delete(R1, [10,20,30,40,50,60,70,80,90,100]));
```

### MCQ Option Shuffling

Apply `random_permutation()` to MCQ option lists so the correct
answer doesn't always appear in the same position (P-STACK-23):

```maxima
options_raw: [[1, true, "Series"], [2, false, "Parallel"],
              [3, false, "Neither"]];
mcq_options: random_permutation(options_raw);
```

### Discrete Parameter Sets

For complex problems where individual random parameters interact,
define complete parameter sets:

```maxima
set: rand(3) + 1;
if set = 1 then (R:100, L:0.01, C:1e-6)
else if set = 2 then (R:200, L:0.05, C:0.5e-6)
else (R:50, L:0.02, C:2e-6);
```

This guarantees every combination is physically valid and has been
manually verified.

---

## §10 Common Pitfalls

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `AlgEquiv` fails on expression involving `%pi` | Float contamination: `1e-7` instead of `1/10^7` | Use exact rational arithmetic for all symbolic constants |
| `round(2.5)` gives 2 | Maxima uses banker's rounding | Use `ceiling(x - 0.5)` or design around it |
| Worked solution shows computed value instead of formula | `simp:true` (default) simplified the display variable | Set `simp:false` before assigning display variables |
| `simp:false` breaks downstream computation | Variables assigned after `simp:false` stay unsimplified | Use `ev(expr, simp)` for values that need computation |
| Student enters variable name and gets full marks | Single-character variable name matches a questionvariable | Use multi-character variable names: `R1` not `R` |
| `log` displays as ln | STACK default rendering | Use `texput(log, "\\mathrm{log}_e", prefix)` if you want log_e |
| `[[1,2],[3,4]]` treated as matrix not list | Maxima auto-parses nested lists as matrices | Use `args()` to convert back to list of lists |

---

## Sources

Content synthesized from:
- Lowe, Sangwin, Jones. *Getting started with STACK* (2019), Appendices A--B
- Maxima 5.24 manual (selected chapters)
- STACK online documentation
- Patterns from EM-AC-STACK-Assessments question bank
