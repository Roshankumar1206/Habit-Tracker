# Mekala Roshan Kumar — Habit Tracker — Understanding Check

- **Assessment:** assessment1
- **Score:** 23 / 40 (57%)
- **Skipped:** 0
- **Duration:** 21 min
- **Submitted:** 2026-08-01T07:39:49.901Z
- **Checksum:** OK — file matches what the server wrote
- **Left the tab:** 0 time(s), 0s total

## By topic

| Topic | Score |
| --- | --- |
| 1. Project Setup & Tooling | 2 / 4 |
| 2. Components, JSX & Rendering Lists | 2 / 6 |
| 3. State, Events & Immutability | 7 / 9 |
| 4. Effects & Custom Hooks | 4 / 7 |
| 5. The Context API | 2 / 4 |
| 6. TypeScript & the Button Component | 3 / 4 |
| 7. App Logic & date-fns | 3 / 6 |

## Review

### Q01 ✅

Looking at the scripts in package.json, which command starts the local development server with hot reload?

- **A.** npm run build
- **B.** npm run preview
- **C.** npm run dev  _(correct, his answer)_
- **D.** npm run lint

> dev runs vite with HMR; build compiles, preview serves the built output.

### Q02 ❌

The build script is "tsc -b && vite build". What does the tsc -b part do before Vite runs?

- **A.** Type-checks the TypeScript project and fails the build if there are type errors  _(correct)_
- **B.** Installs any missing npm packages
- **C.** Minifies the CSS output
- **D.** Runs the ESLint rules  _(his answer)_

> Vite strips types without checking them, so tsc -b is what actually type-checks the project.

### Q03 ✅

index.html contains <div id="root"></div>. Which line in main.tsx is what actually attaches React to that element?

- **A.** import './index.css'
- **B.** <StrictMode>
- **C.** import App from './App.tsx'
- **D.** createRoot(document.getElementById('root')!).render(...)  _(correct, his answer)_

> createRoot takes the DOM node and render() mounts the tree into it.

### Q04 ❌

Why is <App /> wrapped in <StrictMode> in main.tsx?

- **A.** It makes the production bundle smaller
- **B.** It is required for TypeScript to compile .tsx files  _(his answer)_
- **C.** It stops users from opening the browser devtools
- **D.** In development it runs extra checks and deliberately double-invokes certain functions to surface bugs  _(correct)_

> StrictMode is dev-only: double-invokes renders/effects to expose impure code and missing cleanup.

### Q05 ❌

In HabitList.tsx you render habits.map(habit => <HabitItem key={habit.id} ... />). Why does React need the key prop?

- **A.** It sets the id attribute on the rendered HTML element  _(his answer)_
- **B.** It tells React what order to sort the list in
- **C.** It lets React match each item across renders so it can update and reorder the list correctly  _(correct)_
- **D.** It is required by TypeScript whenever you map over an array

> Keys are React's identity for list items across renders.

### Q06 ✅

What is the main problem with using key={index} instead of key={habit.id} in that same list?

- **A.** Nothing — index keys are always fine
- **B.** When a habit is deleted from the middle, all the indices shift and React can end up associating DOM or state with the wrong habit  _(correct, his answer)_
- **C.** React throws a runtime error
- **D.** The list would render in reverse order

> Index keys break on insert/delete/reorder — state can stick to the wrong row.

### Q07 ✅

In HabitItem you have {streak !== 0 && <span className="text-sm text-amber-400">🔥 {streak}</span>}. What appears on screen when streak is 0?

- **A.** Nothing is rendered for that expression  _(correct, his answer)_
- **B.** The number 0 appears on screen
- **C.** The word false appears on screen
- **D.** React throws an error

> false short-circuits and React renders nothing for booleans.

### Q08 ❌

Suppose that same line had been written as {streak && <span>🔥 {streak}</span>} — without the !== 0 check. What would show on screen when streak is 0?

- **A.** The number 0 would be rendered on screen  _(correct)_
- **B.** undefined would render
- **C.** Nothing would render  _(his answer)_
- **D.** React would throw an error

> 0 is falsy but is NOT a boolean, so React renders the 0. This is why the !== 0 check is there.

### Q09 ❌

In App.tsx, <HabitProvider> wraps <Header />, <HabitForm /> and <HabitList />. What is it inside HabitProvider that makes those three components actually appear on the page?

- **A.** HabitProvider renders its children prop  _(correct)_
- **B.** The useEffect inside App.tsx  _(his answer)_
- **C.** React automatically renders anything nested inside any component
- **D.** The key prop

> HabitProvider takes children: ReactNode and renders it inside the context provider.

### Q10 ❌

Button.tsx renders <button {...props} className={...} /> and never mentions children anywhere. So how does the text "Add Habit" still end up inside the button?

- **A.** React automatically forwards any text it finds
- **B.** children is just another prop, so it gets passed through by the {...props} spread  _(correct)_
- **C.** The Button component reads the text back out of the DOM
- **D.** twMerge injects the text into the button  _(his answer)_

> children is an ordinary prop, so it flows through the {...props} rest spread.

### Q11 ❌

In const [weekOffset, setWeekOffset] = useState(0), what is the [weekOffset, setWeekOffset] syntax doing?

- **A.** Object destructuring
- **B.** Array destructuring of the pair that useState returns  _(correct)_
- **C.** Using the spread operator
- **D.** Declaring a TypeScript tuple type  _(his answer)_

> useState returns a two-element array; the brackets destructure it.

### Q12 ✅

The Next button uses setWeekOffset(o => o + 1) rather than setWeekOffset(weekOffset + 1). Why prefer the function form?

- **A.** It is required whenever the piece of state is a number
- **B.** It is purely a style preference with no behavioural difference
- **C.** It avoids triggering a re-render
- **D.** It updates based on the latest queued state value, which stays correct even when React batches updates  _(correct, his answer)_

> The updater receives the latest pending state, so it survives batching and stale closures.

### Q13 ✅

App.tsx recalculates visibleDates on every render from weekOffset, instead of storing it in its own useState. What is this approach called?

- **A.** Derived state — computing a value from existing state instead of duplicating it in another useState  _(correct, his answer)_
- **B.** Prop drilling
- **C.** A side effect
- **D.** Memoization

> Anything computable from existing state should be computed, not stored — no sync bugs.

### Q14 ✅

The input in HabitForm.tsx has both value={name} and onChange={e => setName(e.target.value)}. This makes it:

- **A.** A controlled input, where React state is the single source of truth  _(correct, his answer)_
- **B.** An uncontrolled input
- **C.** A ref-based input
- **D.** A native HTML form action

> value + onChange = controlled; React state drives the DOM.

### Q15 ❌

If you deleted value={name} from that input but kept the onChange handler, what would happen when setName("") runs after submitting?

- **A.** The input would clear exactly as it does now  _(his answer)_
- **B.** React would throw a warning and crash
- **C.** The typed text would stay in the box, because the DOM is now holding the value instead of React  _(correct)_
- **D.** The form would submit a second time

> Without value, the input is uncontrolled — React no longer drives what is displayed.

### Q16 ✅

What does e.preventDefault() do at the top of handleSubmit?

- **A.** It stops the click from bubbling up to parent elements
- **B.** It prevents the browser's default form submission, which would reload the whole page  _(correct, his answer)_
- **C.** It stops the habit from being added twice
- **D.** It prevents the input from being cleared

> Default form submit navigates/reloads. Note it does NOT stop propagation.

### Q17 ✅

deleteHabit is written as setHabits(curr => curr.filter(h => h.id !== id)). Why use filter instead of finding the index and calling curr.splice(i, 1)?

- **A.** filter runs faster than splice
- **B.** splice does not exist on arrays
- **C.** filter returns a brand-new array, whereas splice mutates the existing state array in place and React can miss the change  _(correct, his answer)_
- **D.** filter also sorts the array for you

> State must be replaced, not mutated. splice mutates the same array reference.

### Q18 ✅

In toggleHabit you return { ...h, completions } rather than doing h.completions = completions and returning h. Why does that matter?

- **A.** Spread syntax is shorter to type
- **B.** It produces a new habit object instead of mutating state, which is how React detects that something changed  _(correct, his answer)_
- **C.** It removes the old habit from the array
- **D.** It converts the habit into JSON

> Same immutability rule at the object level — new reference signals the change.

### Q19 ✅

addHabit uses crypto.randomUUID() for the habit id. Why would using habits.length as the id be a bug?

- **A.** length is a string, not a number
- **B.** It would be noticeably slower to compute
- **C.** React does not allow ids that are numbers
- **D.** After a habit is deleted, lengths repeat — so two different habits could end up with the same id  _(correct, his answer)_

> Ids must be stable and unique; length collides after deletion.

### Q20 ❌

In the useEffect in App.tsx, what is the returned function for?

- **A.** It is the cleanup function — React runs it before the effect runs again and when the component unmounts, so listeners don't pile up  _(correct)_
- **B.** It runs once before the very first render
- **C.** It cancels the click event
- **D.** It is the value the effect hands back to the parent component  _(his answer)_

> Cleanup runs before the next effect and on unmount; without it listeners accumulate.

### Q21 ❌

That effect's dependency array is [weekOffset]. What happens each time weekOffset changes?

- **A.** Nothing — an effect only ever runs once  _(his answer)_
- **B.** The component unmounts and remounts
- **C.** The cleanup runs first to remove the old listener, then the effect body runs again and adds a fresh one  _(correct)_
- **D.** The effect body runs again but the cleanup never does

> Dependency change = cleanup then re-run, which is how the handler gets a fresh weekOffset.

### Q22 ✅

If that dependency array were [] instead of [weekOffset], what would console.log(weekOffset) print after you clicked Next several times and then clicked the page?

- **A.** The current weekOffset each time
- **B.** undefined
- **C.** It would throw an error
- **D.** Always 0, because the handler captured the value from the first render and was never replaced  _(correct, his answer)_

> Classic stale closure — the handler is never replaced so it keeps the first render's value.

### Q23 ✅

If the dependency array were removed entirely — useEffect(() => { ... }) with no second argument — how often would the effect run?

- **A.** Only once, after the first render
- **B.** After every single render  _(correct, his answer)_
- **C.** Never
- **D.** Only when the component unmounts

> No dependency array means run after every render.

### Q24 ❌

useLocalStorage calls useState<T>(() => { ... }) — passing a function rather than a plain value. What does that achieve?

- **A.** It is a lazy initializer — the localStorage read and JSON.parse run only on the first render instead of on every render  _(correct)_
- **B.** It makes the state update asynchronous  _(his answer)_
- **C.** It is required syntax whenever useState is given a generic type
- **D.** It prevents the state from ever changing

> Lazy initializer — the function only runs on the first render, so localStorage isn't read every time.

### Q25 ✅

useLocalStorage ends with return [storedValue, setStoredValue] as const. What is as const doing there?

- **A.** Making the array read-only at runtime
- **B.** Freezing the state value so it cannot be reassigned
- **C.** Typing the return as a fixed tuple [T, setter] instead of a mixed array, so destructuring gives each variable the right type  _(correct, his answer)_
- **D.** Nothing — it could be removed with no effect

> Without as const TS widens it to (T | setter)[] and destructuring loses the types.

### Q26 ✅

The useEffect inside useLocalStorage has [storedValue, key] as its dependencies. When does it write to localStorage?

- **A.** Only once, when the component mounts
- **B.** After every render, unconditionally
- **C.** Before the component renders
- **D.** After any render in which storedValue or key changed  _(correct, his answer)_

> Effects run after render, and only when a listed dependency changed.

### Q27 ❌

Why does this app put habits in a Context instead of passing them down as props from App?

- **A.** Context is faster than passing props
- **B.** It avoids prop drilling — Header and HabitList read the habits directly instead of App threading them through every level  _(correct)_
- **C.** Props cannot hold arrays or functions  _(his answer)_
- **D.** Context saves the data to a server

> Avoids prop drilling; consumers subscribe directly.

### Q28 ✅

In usehabit.ts the context is created as createContext<null | Context>(null). Why is null part of the type and used as the default value?

- **A.** Because a component rendered outside HabitProvider would receive that default, so the type has to admit that possibility  _(correct, his answer)_
- **B.** Because TypeScript requires every context to allow null
- **C.** Because context values are always null and stay null
- **D.** To make every field inside the context optional

> The default is what a consumer outside the provider sees, so the type must include it.

### Q29 ❌

useHabits() does if (habitContext == null) throw new Error("Null context"). What does that guard buy you?

- **A.** It replaces the null with an empty context object  _(his answer)_
- **B.** It gives a clear error if the hook is used outside HabitProvider, and it narrows the type so every caller can use the value without null-checking  _(correct)_
- **C.** It creates a new context on the fly
- **D.** It only logs a warning to the console

> Fail loudly + type narrowing, so useHabits() always returns a non-null Context.

### Q30 ✅

Every render of HabitProvider builds a brand-new object { habits, addHabit, toggleHabit, deleteHabit } as the context value. What is the consequence of that?

- **A.** The context is torn down and rebuilt from scratch
- **B.** The provider unmounts its children
- **C.** localStorage gets cleared
- **D.** Every component that calls useHabits re-renders  _(correct, his answer)_

> A new value identity notifies every consumer — the usual reason people reach for useMemo here.

### Q31 ✅

What does type ButtonProps = { variant?: Variant } & ComponentProps<"button"> accomplish?

- **A.** It replaces all the native button props with just variant
- **B.** It adds an optional variant prop on top of every standard <button> prop, such as onClick, disabled and children  _(correct, his answer)_
- **C.** It makes variant a required prop
- **D.** It converts the component into a plain div

> Intersection type: your own prop plus all the native button props.

### Q32 ❌

Given function Button({ variant = "primary", className, ...props }: ButtonProps), what does props contain inside the function body?

- **A.** Every prop, including variant and className  _(his answer)_
- **B.** Only onClick
- **C.** All the remaining props except variant and className, which were pulled out by the destructuring  _(correct)_
- **D.** An empty object

> Rest destructuring collects everything not explicitly named.

### Q33 ✅

In Header.tsx you have format(visibleDates.at(-1)!, "MMM d"). What does .at(-1) return, and what does the ! mean?

- **A.** The first element; ! is the logical NOT operator
- **B.** The array's length; ! is required syntax after .at()
- **C.** A shallow copy of the array; ! reverses it
- **D.** The last element; ! is a non-null assertion telling TypeScript the value is not undefined  _(correct, his answer)_

> .at(-1) indexes from the end; ! is the non-null assertion.

### Q34 ✅

What job does twMerge from tailwind-merge do in Button.tsx?

- **A.** It merges Tailwind class strings and resolves conflicts, so a className passed into Button wins over the defaults  _(correct, his answer)_
- **B.** It compiles Tailwind CSS at build time
- **C.** It minifies the class names for production
- **D.** It converts Tailwind utilities into plain CSS rules

> twMerge resolves conflicting Tailwind utilities so the later/passed class wins.

### Q35 ✅

In startOfWeek(week, { weekStartsOn: 1 }), what does weekStartsOn: 1 mean?

- **A.** The week starts on Sunday
- **B.** It shifts the week forward by one
- **C.** It selects the first week of the year
- **D.** The week starts on Monday  _(correct, his answer)_

> 0 = Sunday, 1 = Monday in date-fns.

### Q36 ❌

In Header.tsx the Next button has disabled={visibleDates.some(d => isToday(d))}. What is the practical effect?

- **A.** Next is disabled at weekends
- **B.** Next is disabled while there are no habits yet  _(his answer)_
- **C.** Next is disabled whenever the week on screen contains today, so you cannot browse into future weeks  _(correct)_
- **D.** Next is permanently disabled

> Stops navigating past the current week.

### Q37 ❌

Trace getStreak. Today is Wednesday, and a habit's completions contains Wednesday and Tuesday but NOT Monday. What does it return?

- **A.** 0  _(his answer)_
- **B.** 1
- **C.** 2  _(correct)_
- **D.** 3

> Wed counts (1), Tue counts (2), Mon fails the check → 2.

### Q38 ✅

Same getStreak function. Today is Wednesday. This time completions contains Tuesday and Monday, but today has NOT been completed yet. What does it return?

- **A.** 2
- **B.** 1
- **C.** 0  _(correct, his answer)_
- **D.** 3

> The while condition fails on the very first check, so it returns 0 — the streak resets before the day is done. A real quirk of this implementation.

### Q39 ✅

useLocalStorage passes a dateReviver to JSON.parse. What problem is that solving?

- **A.** It compresses the stored JSON
- **B.** JSON has no Date type, so saved dates come back as plain strings — the reviver turns matching ISO strings back into real Date objects  _(correct, his answer)_
- **C.** It encrypts whatever is written to localStorage
- **D.** It sorts the completions by date

> JSON round-trips Dates into ISO strings; the reviver rebuilds them.

### Q40 ❌

What would actually break if you deleted dateReviver and just called JSON.parse(item)?

- **A.** Nothing would change
- **B.** localStorage would stop saving anything  _(his answer)_
- **C.** All saved habits would be deleted on refresh
- **D.** After a refresh, completions would hold strings instead of Dates, so the isSameDay comparisons — the day checkmarks and the streak — would stop working  _(correct)_

> date-fns comparisons on strings would break the checkmarks and streak after any refresh.
