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
        front: "How do you fetch data safely in useEffect?",
        back: "Track an ignore flag or AbortController in the effect and cancel it in cleanup, so a slow earlier response cannot overwrite a newer one. Often a data library (React Query, SWR) is preferable.",
      },
    ],
  },
];
