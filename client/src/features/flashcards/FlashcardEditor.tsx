import { useEffect, useRef, useState, type FormEvent } from "react";
import { RequiredLabel } from "../../components/RequiredLabel";
import type { StudyCard, StudyDeck } from "./storage";

type FlashcardEditorProps = {
  card?: StudyCard;
  deckId: string;
  decks: StudyDeck[];
  onClose: () => void;
  onSave: (deckId: string, front: string, back: string) => void;
};

export function FlashcardEditor({ card, deckId, decks, onClose, onSave }: FlashcardEditorProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const deckTitle = decks.find((deck) => deck.id === deckId)?.title ?? "";
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector("textarea")?.focus();
    return () => element?.close();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!front.trim() || !back.trim()) {
      setError("Enter both a question and an answer.");
      return;
    }
    try {
      onSave(deckId, front.trim(), back.trim());
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the flashcard.");
    }
  }

  const fieldClass = "w-full rounded-md border border-[#D6D6D2] bg-white px-3 py-2.5 font-normal leading-6 outline-none";
  return (
    <dialog aria-labelledby="flashcard-editor-title" className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-[#D6D6D2] bg-white p-6 text-[#202020] shadow-2xl backdrop:bg-[#202020]/55 sm:p-8" ref={dialog} onCancel={onClose}>
      <form onSubmit={submit}>
        <header className="border-b border-[#D6D6D2] pb-4">
          <h2 className="text-2xl font-bold" id="flashcard-editor-title">{card ? "Edit flashcard" : "Create flashcard"}</h2>
          <p className="mt-2 text-sm text-[#686868]">Write a question on the front and an answer on the back.</p>
        </header>
        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">Set
            <input className={`${fieldClass} bg-[#F4F4F2] text-[#686868]`} readOnly value={deckTitle} />
          </label>
          <label className="grid gap-2 text-sm font-bold"><RequiredLabel>Question</RequiredLabel>
            <textarea autoFocus className={`${fieldClass} min-h-24 resize-y`} required value={front} onChange={(event) => setFront(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-bold"><RequiredLabel>Answer</RequiredLabel>
            <textarea className={`${fieldClass} min-h-36 resize-y`} required value={back} onChange={(event) => setBack(event.target.value)} />
          </label>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#686868]">Saved in this browser for your account. Your changes will not appear on other devices.</p>
        <footer className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold hover:bg-[#F4F4F2]" type="button" onClick={onClose}>Cancel</button>
          <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold hover:bg-[#C95712] hover:text-white" type="submit">{card ? "Save changes" : "Create flashcard"}</button>
        </footer>
      </form>
    </dialog>
  );
}
