export type Flashcard = { front: string; back: string };
export type FlashcardDeck = {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
};

export const flashcardDecks: FlashcardDeck[] = [
  {
    id: "react-hooks",
    title: "React Hooks",
    description:
      "Core hooks and the rules behind them, as they come up in frontend interviews.",
    cards: [
      {
        front: "What problem do Hooks solve?",
        back: "They let function components use state, lifecycle behavior, and other React features without classes, and make stateful logic reusable through custom Hooks instead of HOCs or render props.",
      },
      {
        front: "What are the Rules of Hooks?",
        back: "Only call Hooks at the top level (not in loops, conditions, or nested functions), and only from React function components or custom Hooks. React relies on call order to match state to each Hook.",
      },
      {
        front:
          "How does useState work, and why use the functional update form?",
        back: "useState returns [value, setValue]. setValue schedules a re-render. Use setValue(prev => next) when the new state depends on the previous one, so batched or stale-closure updates stay correct.",
      },
      {
        front: "What does useEffect do and when does it run?",
        back: "It runs side effects (fetching, subscriptions, DOM work) after render commits. With no dependency array it runs after every render; with [] only after mount; with [a, b] when a or b change.",
      },
      {
        front: "What is the effect cleanup function?",
        back: "The function returned from useEffect. React runs it before the effect re-runs and on unmount, so you can cancel subscriptions, timers, or in-flight requests and avoid leaks.",
      },
      {
        front:
          "What is the dependency array for, and what happens if you omit values?",
        back: "It tells React which reactive values the effect uses. Omitting one causes a stale closure: the effect keeps reading old values. The exhaustive-deps lint rule catches this.",
      },
      {
        front: "When should you use useRef?",
        back: "To hold a mutable value that persists across renders without causing re-renders, such as a DOM node, timer id, or previous value. Changing ref.current does not trigger a render.",
      },
      {
        front: "What does useMemo do?",
        back: "It caches the result of an expensive calculation between renders and recomputes only when its dependencies change. It is a performance optimization, not a semantic guarantee.",
      },
      {
        front: "What does useCallback do?",
        back: "It returns a memoized function that keeps the same identity until dependencies change. It is useful when passing callbacks to memoized children (React.memo) or as effect dependencies.",
      },
      {
        front: "useMemo vs useCallback?",
        back: "useMemo(() => fn(), deps) memoizes the returned value; useCallback(fn, deps) memoizes the function itself. useCallback(fn, deps) is equivalent to useMemo(() => fn, deps).",
      },
      {
        front: "When would you choose useReducer over useState?",
        back: "When state has multiple related fields or complex transitions, or the next state depends on actions. It centralizes update logic in a pure reducer and makes it easy to test.",
      },
      {
        front: "What is useContext used for?",
        back: "It reads the nearest value of a Context, avoiding prop drilling. Every consumer re-renders when the provided value changes, so split contexts or memoize the value to limit renders.",
      },
      {
        front: "useEffect vs useLayoutEffect?",
        back: "useLayoutEffect runs synchronously after DOM mutations but before the browser paints, so use it to measure layout and avoid flicker. useEffect runs after paint and is the right default.",
      },
      {
        front: "What is a custom Hook?",
        back: "A function whose name starts with 'use' and that calls other Hooks. It extracts reusable stateful logic; each call gets its own isolated state.",
      },
      {
        front: "Why does React run effects twice in development Strict Mode?",
        back: "It mounts, unmounts, and remounts components to expose effects with missing cleanup. It only happens in development and does not affect production.",
      },
      {
        front:
          "Why can state appear stale inside a setTimeout or event handler?",
        back: "Closures capture the state from the render in which they were created. Use the functional updater, a ref for the latest value, or correct effect dependencies.",
      },
      {
        front: "What does useId do?",
        back: "It generates a stable unique id that matches between server and client renders, useful for linking labels and inputs for accessibility without hydration mismatches.",
      },
      {
        front: "What is useTransition?",
        back: "It marks a state update as non-urgent so React can keep the UI responsive, keeping the current UI while the transition renders. It returns [isPending, startTransition].",
      },
      {
        front: "What does useDeferredValue do?",
        back: "It returns a deferred copy of a value that lags behind during urgent updates, letting expensive renders (like filtering a big list) happen at lower priority.",
      },
      {
        front: "How do async functions work in React components?",
        back: "Use async functions in event handlers or define and call one inside an effect. Do not make the useEffect callback itself async because an effect may only return undefined or a cleanup function, not a Promise.",
      },
      {
        front: "What is a Promise, and how do you handle one?",
        back: "A Promise represents a future result and can be pending, fulfilled, or rejected. Handle it with await inside an async function or with .then() and .catch(), and use try/catch with await for failures.",
      },
      {
        front: "What should you check when fetching data with fetch?",
        back: "fetch only rejects for network failures, so check response.ok before parsing response.json(). Handle cancellation and stale responses, and never update state after the request is no longer relevant.",
      },
      {
        front: "How should loading and error states be modeled?",
        back: "Track the request states explicitly: loading, success data, and error. Clear stale errors when retrying, set loading before the request, and finish in finally or in every success and failure path.",
      },
      {
        front: "What is a controlled input?",
        back: "An input whose value comes from React state and whose onChange handler updates that state. React becomes the source of truth, which makes validation, formatting, and form submission predictable.",
      },
      {
        front: "What belongs in component state?",
        back: "Store values that change over time and affect rendering. Avoid storing values that can be derived from props or other state; calculate those during render or memoize only when the calculation is expensive.",
      },
      {
        front: "How should React event handlers be passed?",
        back: "Pass a function such as onClick={handleClick} or onClick={() => handleClick(id)}. Calling it during render, like onClick={handleClick()}, runs immediately instead of waiting for the event.",
      },
      {
        front: "How do you render lists correctly in React?",
        back: "Use array.map() to return elements and give each sibling a stable, unique key from the data. Keys help React match items across inserts, removals, and reordering; avoid array indexes when order can change.",
      },
      {
        front: "What are common ways to render UI conditionally?",
        back: "Use an early return, a ternary for either/or output, && for optional output, or assign JSX to a variable. Choose the clearest form and keep complex conditions outside the JSX.",
      },
      {
        front: "How do you fetch data safely in useEffect?",
        back: "Track an ignore flag or AbortController in the effect and cancel it in cleanup, so a slow earlier response cannot overwrite a newer one. Often a data library (React Query, SWR) is preferable.",
      },
    ],
  },
  {
    id: "product-mind",
    title: "Product Mind",
    description:
      "Practice product judgment, collaboration, prioritization, and reliability questions.",
    cards: [
      {
        front: "Tell me about a feature you owned end-to-end.",
        back: "I worked on a data-heavy media planning application. One feature I’m proud of connected an AG Grid table with a D3 visualization. I worked with Product and Design to understand the requirements, built the feature, tested it with QA, and supported the release. It helped users explore and update complex data more easily.",
      },
      {
        front: "What do you do when requirements are unclear?",
        back: "I start by understanding the user problem and expected outcome. Then I work with Product and Design to clarify requirements. Sometimes I build a quick prototype to help everyone visualize the solution before implementation.",
      },
      {
        front: "Tell me about a time you disagreed with Product or Design.",
        back: "When I see a technical limitation or a better approach, I explain the trade-offs to Product and Design. I try to suggest alternatives that still solve the user problem. My goal is to find the best solution together, not just push my own idea.",
      },
      {
        front: "How do you decide what to cut when a deadline is approaching?",
        back: "I focus on the core functionality users need. I discuss trade-offs with Product and suggest moving lower-priority features or small UI improvements to a later release. I never compromise on critical functionality or quality.",
      },
      {
        front: "How do you know whether a feature was successful?",
        back: "I check whether it solves the original user problem and meets the acceptance criteria. I also look at QA results and user feedback. If possible, I measure whether it improves the user’s workflow or reduces manual work.",
      },
      {
        front: "Tell me about a time you found an edge case Product had not considered.",
        back: "During implementation, I sometimes found edge cases that weren’t covered in the original requirements, especially when working with complex data. I brought them up early with Product and Design, explained the impact, and worked together to adjust the requirements.",
      },
      {
        front: "What would you do if Product wants something that is technically risky?",
        back: "I would explain the risk in simple terms, including how it could affect users or system reliability. Then I’d suggest a safer alternative or a smaller first version that still delivers value.",
      },
      {
        front: "How do you prioritize user experience versus engineering complexity?",
        back: "I start with the user problem. I prefer the simplest solution that provides a good user experience and is easy to maintain. If something adds a lot of complexity without much user value, I discuss a simpler approach with Product.",
      },
      {
        front: "How do you work with Design and QA?",
        back: "I collaborate with Design early to understand the expected behavior and identify technical limitations. During development, I communicate any issues or edge cases. I work with QA to verify functionality and fix problems before release.",
      },
      {
        front: "How would you approach a healthcare feature where reliability matters?",
        back: "I would first understand the user workflow and identify critical requirements. I’d focus on data accuracy, privacy, error handling, and clear feedback to users. I would also test edge cases carefully because mistakes in healthcare can directly affect patients.",
      },
    ],
  },
];
