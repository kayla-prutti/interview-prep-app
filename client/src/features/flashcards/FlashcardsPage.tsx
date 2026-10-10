import { useEffect, useRef, useState, type ReactNode } from "react";
import { PageHeader } from "../../components/PageHeader";
import { flashcardDecks } from "./decks";

type FlashcardsPageProps = { accountControl?: ReactNode };

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FlashcardsPage({ accountControl }: FlashcardsPageProps) {
  const [deckId, setDeckId] = useState(flashcardDecks[0].id);
  const deck =
    flashcardDecks.find((item) => item.id === deckId) ?? flashcardDecks[0];
  const [cards, setCards] = useState(deck.cards);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const card = cards[index];
  const go = (next: number) => {
    setIndex(Math.min(cards.length - 1, Math.max(0, next)));
    setIsFlipped(false);
  };
  const reset = (nextCards: typeof cards) => {
    setCards(nextCards);
    setIndex(0);
    setIsFlipped(false);
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !menuRef.current?.contains(event.target as Node)
      )
        setIsMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      )
        return;
      if (event.key === "ArrowRight") go(index + 1);
      else if (event.key === "ArrowLeft") go(index - 1);
      else if (event.key === " " && target?.tagName !== "BUTTON") {
        event.preventDefault();
        setIsFlipped((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section
      className="w-full md:flex md:h-full md:min-h-0 md:flex-col"
      id="flashcards"
    >
      <PageHeader
        accountControl={accountControl}
        description="Flip through short cards to drill the concepts interviewers ask about most."
        eyebrow="Study deck"
        title="Flashcards"
      />
      <div className="mx-auto mt-7 flex w-full max-w-2xl flex-wrap items-center gap-3 md:mt-5">
        <label
          className="text-sm font-semibold text-[#4A4A4A]"
          htmlFor="flashcard-deck"
        >
          Deck
        </label>
        <div className="relative min-w-0 flex-1 sm:flex-none" ref={menuRef}>
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="listbox"
            className="flex w-full items-center justify-between gap-3 rounded-md border border-[#BDBDB8] bg-white px-3 py-2 text-left text-sm font-semibold sm:min-w-56"
            id="flashcard-deck"
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            <span className="truncate">
              {deck.title} ({deck.cards.length})
            </span>
            <span
              aria-hidden="true"
              className={`text-xs transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          {isMenuOpen && (
            <ul
              aria-labelledby="flashcard-deck"
              className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full min-w-56 overflow-y-auto rounded-md border border-[#BDBDB8] bg-white py-1 shadow-lg"
              role="listbox"
            >
              {flashcardDecks.map((item) => (
                <li
                  aria-selected={item.id === deck.id}
                  key={item.id}
                  role="option"
                >
                  <button
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[#FFF8F2] ${item.id === deck.id ? "font-bold text-[#C95712]" : "font-semibold"}`}
                    type="button"
                    onClick={() => {
                      setDeckId(item.id);
                      reset(item.cards);
                      setIsMenuOpen(false);
                    }}
                  >
                    {item.title} ({item.cards.length})
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          className="rounded-md border border-[#BDBDB8] bg-white px-3 py-2 text-sm font-bold hover:bg-[#FFF8F2] sm:ml-auto"
          type="button"
          onClick={() => reset(shuffle(deck.cards))}
        >
          Shuffle
        </button>
        <button
          className="rounded-md border border-[#BDBDB8] bg-white px-3 py-2 text-sm font-bold hover:bg-[#FFF8F2]"
          type="button"
          onClick={() => reset(deck.cards)}
        >
          Reset order
        </button>
      </div>
      <p className="mx-auto mt-3 w-full max-w-2xl text-sm text-[#686868]">
        {deck.description}
      </p>

      <div className="mt-6 flex flex-1 flex-col items-center md:min-h-0 md:justify-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#C95712]">
          Card {index + 1} of {cards.length}
        </p>
        <button
          aria-label={isFlipped ? "Show question" : "Show answer"}
          className="grid min-h-[260px] w-full max-w-2xl place-items-center rounded-xl border border-[#BDBDB8] bg-white p-6 text-center shadow-[0_14px_34px_rgba(32,32,32,0.08)] transition-colors hover:bg-[#FFF8F2] sm:min-h-[300px] sm:p-10"
          type="button"
          onClick={() => setIsFlipped((value) => !value)}
        >
          <span>
            <span
              className={`mb-4 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isFlipped ? "bg-[#F5822A] text-[#202020]" : "bg-[#3D3F40] text-white"}`}
            >
              {isFlipped ? "Answer" : "Question"}
            </span>
            <span
              className={`block leading-8 text-[#202020] ${isFlipped ? "text-base" : "text-xl font-bold"}`}
            >
              {isFlipped ? card.back : card.front}
            </span>
            <span className="mt-5 block text-xs text-[#686868]">
              Click or press space to flip
            </span>
          </span>
        </button>
        <div className="mt-5 flex w-full max-w-2xl items-center justify-between gap-3">
          <button
            className="rounded-md border border-[#BDBDB8] bg-white px-4 py-2.5 text-sm font-bold hover:bg-[#FFF8F2] disabled:opacity-40"
            disabled={index === 0}
            type="button"
            onClick={() => go(index - 1)}
          >
            ← Previous
          </button>
          <button
            className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] shadow-sm hover:bg-[#C95712] hover:text-white disabled:opacity-40"
            disabled={index === cards.length - 1}
            type="button"
            onClick={() => go(index + 1)}
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
