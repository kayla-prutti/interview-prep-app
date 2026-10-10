import { useEffect, useRef, useState, type ReactNode } from "react";
import { PageHeader } from "../../components/PageHeader";
import { FlashcardEditor } from "./FlashcardEditor";
import { FlashcardSetEditor } from "./FlashcardSetEditor";
import { emptyChanges, loadChanges, saveChanges, studyDecks, type StudyCard } from "./storage";

type FlashcardsPageProps = { accountControl?: ReactNode; accountId?: string };

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FlashcardsPage({ accountControl, accountId = "local" }: FlashcardsPageProps) {
  const [loaded] = useState(() => {
    try {
      return { changes: loadChanges(accountId), error: "" };
    } catch (caught) {
      return { changes: emptyChanges(), error: caught instanceof Error ? caught.message : "Could not load your saved flashcards." };
    }
  });
  const [changes, setChanges] = useState(loaded.changes);
  const flashcardDecks = studyDecks(changes);
  const [deckId, setDeckId] = useState(flashcardDecks[0].id);
  const deck =
    flashcardDecks.find((item) => item.id === deckId) ?? flashcardDecks[0];
  const [cards, setCards] = useState(deck.cards);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<{ card?: StudyCard } | null>(null);
  const [message, setMessage] = useState("");
  const [isSetEditorOpen, setIsSetEditorOpen] = useState(false);

  function createSet(title: string, description: string) {
    if (loaded.error) throw new Error(loaded.error);
    if (flashcardDecks.some((set) => set.title.toLocaleLowerCase() === title.toLocaleLowerCase())) {
      throw new Error("A set with this name already exists. Choose another name.");
    }
    const set = { id: `set:${crypto.randomUUID()}`, title, description };
    const next = { ...changes, sets: [...changes.sets, set] };
    saveChanges(accountId, next);
    setChanges(next);
    setDeckId(set.id);
    reset([]);
    setMessage("Flashcard set created. Add your first card to start studying.");
  }

  function save(targetDeckId: string, front: string, back: string) {
    if (loaded.error) throw new Error(loaded.error);
    const existing = editor?.card;
    const id = existing?.id ?? crypto.randomUUID();
    const updated = { id, front, back };
    const next = existing
      ? changes.created.some((item) => item.id === id)
        ? { ...changes, created: changes.created.map((item) => item.id === id ? { ...item, front, back } : item) }
        : { ...changes, edits: { ...changes.edits, [id]: { front, back } } }
      : { ...changes, created: [...changes.created, { ...updated, deckId: targetDeckId }] };
    saveChanges(accountId, next);
    setChanges(next);
    if (existing) {
      setCards((items) => items.map((item) => item.id === id ? updated : item));
    } else {
      const targetCards = studyDecks(next).find((item) => item.id === targetDeckId)!.cards;
      setDeckId(targetDeckId);
      setCards(targetDeckId === deckId ? [...cards, updated] : targetCards);
      setIndex(targetCards.length - 1);
    }
    setIsFlipped(false);
    setMessage(existing ? "Flashcard updated." : "Flashcard created.");
  }

  const card = cards[index];
  const go = (next: number) => {
    setIndex(Math.max(0, Math.min(cards.length - 1, next)));
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
      if (editor || isSetEditorOpen || !card || event.defaultPrevented) return;
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
        action={
          <div className="flex flex-wrap gap-2">
            <button className="flex-1 whitespace-nowrap rounded-md border border-[#BDBDB8] bg-white px-4 py-2.5 text-sm font-bold hover:bg-[#FFF8F2] disabled:opacity-40" disabled={Boolean(loaded.error)} type="button" onClick={() => { setIsMenuOpen(false); setIsSetEditorOpen(true); setMessage(""); }}>+ Create set</button>
            <button className="flex-1 whitespace-nowrap rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:opacity-40" disabled={Boolean(loaded.error)} type="button" onClick={() => { setIsMenuOpen(false); setEditor({}); setMessage(""); }}>+ Add flashcard</button>
          </div>
        }
        description="Flip through short cards to drill the concepts interviewers ask about most."
        eyebrow="Study sets"
        title="Flashcards"
      />
      {loaded.error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{loaded.error}</p>}
      <p className="sr-only" role="status">{message}</p>
      <div className="mx-auto mt-7 flex w-full max-w-2xl flex-wrap items-center gap-3 md:mt-5">
        <label
          className="text-sm font-semibold text-[#4A4A4A]"
          htmlFor="flashcard-deck"
        >
          Set
        </label>
        <div className="relative min-w-0 flex-1 sm:flex-none" ref={menuRef}>
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="listbox"
            className="flex w-full items-center justify-between gap-3 rounded-md border border-[#BDBDB8] bg-white px-3 py-2 text-left text-sm font-semibold sm:min-w-56 sm:max-w-80"
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
                      setMessage("");
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
          className="rounded-md border border-[#BDBDB8] bg-white px-3 py-2 text-sm font-bold hover:bg-[#FFF8F2] disabled:opacity-40 sm:ml-auto"
          disabled={cards.length < 2}
          type="button"
          onClick={() => reset(shuffle(deck.cards))}
        >
          Shuffle
        </button>
        <button
          className="rounded-md border border-[#BDBDB8] bg-white px-3 py-2 text-sm font-bold hover:bg-[#FFF8F2] disabled:opacity-40"
          disabled={cards.length < 2}
          type="button"
          onClick={() => reset(deck.cards)}
        >
          Reset order
        </button>
      </div>
      <p className="mx-auto mt-3 w-full max-w-2xl text-sm text-[#686868]">
        {deck.description}
        <span className="mt-1 block text-xs">Your sets, cards, and edits are saved in this browser for your account.</span>
      </p>

      <div className="mt-6 flex flex-1 flex-col items-center md:min-h-0 md:justify-center">
        {card ? <>
        <div className="mb-3 flex w-full max-w-2xl items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C95712]">Card {index + 1} of {cards.length}</p>
          <button className="rounded-md border border-[#BDBDB8] bg-white px-3 py-2 text-sm font-bold hover:bg-[#FFF8F2] disabled:opacity-40" disabled={Boolean(loaded.error)} type="button" onClick={() => { setEditor({ card }); setMessage(""); }}>Edit flashcard</button>
        </div>
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
              className={`block whitespace-pre-wrap break-words leading-8 text-[#202020] ${isFlipped ? "text-base" : "text-xl font-bold"}`}
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
        </> : <div className="grid min-h-[260px] w-full max-w-2xl place-items-center rounded-xl border border-dashed border-[#BDBDB8] bg-white p-8 text-center">
          <div>
            <h2 className="text-xl font-bold text-[#202020]">Your set is ready</h2>
            <p className="mt-2 text-sm leading-6 text-[#686868]">Add your first flashcard to {deck.title}.</p>
            <button className="mt-5 rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold hover:bg-[#C95712] hover:text-white disabled:opacity-40" disabled={Boolean(loaded.error)} type="button" onClick={() => setEditor({})}>+ Add first flashcard</button>
          </div>
        </div>}
      </div>
      {isSetEditorOpen && <FlashcardSetEditor onClose={() => setIsSetEditorOpen(false)} onSave={createSet} />}
      {editor && <FlashcardEditor card={editor.card} deckId={deckId} decks={flashcardDecks} onClose={() => setEditor(null)} onSave={save} />}
    </section>
  );
}
