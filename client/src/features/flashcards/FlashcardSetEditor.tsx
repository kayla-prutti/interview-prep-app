import { useEffect, useRef, useState, type FormEvent } from "react";
import { RequiredLabel } from "../../components/RequiredLabel";

type FlashcardSetEditorProps = {
  onClose: () => void;
  onSave: (title: string, description: string) => void;
};

export function FlashcardSetEditor({ onClose, onSave }: FlashcardSetEditorProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector("input")?.focus();
    return () => element?.close();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Enter a name for your flashcard set.");
      return;
    }
    try {
      onSave(title.trim(), description.trim());
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create your flashcard set.");
    }
  }

  const fieldClass = "w-full rounded-md border border-[#D6D6D2] bg-white px-3 py-2.5 font-normal leading-6 outline-none";
  return (
    <dialog aria-labelledby="flashcard-set-editor-title" className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-[#D6D6D2] bg-white p-6 text-[#202020] shadow-2xl backdrop:bg-[#202020]/55 sm:p-8" ref={dialog} onCancel={onClose}>
      <form onSubmit={submit}>
        <header className="border-b border-[#D6D6D2] pb-4">
          <h2 className="text-2xl font-bold" id="flashcard-set-editor-title">Create flashcard set</h2>
          <p className="mt-2 text-sm leading-6 text-[#686868]">Group cards by topic, skill, or upcoming interview.</p>
        </header>
        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-bold"><RequiredLabel>Set name</RequiredLabel>
            <input autoFocus className={fieldClass} maxLength={100} placeholder="e.g. JavaScript fundamentals" required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-bold">Description (optional)
            <textarea className={`${fieldClass} min-h-24 resize-y`} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#686868]">You can add flashcards after creating your set.</p>
        <footer className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold hover:bg-[#F4F4F2]" type="button" onClick={onClose}>Cancel</button>
          <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold hover:bg-[#C95712] hover:text-white" type="submit">Create set</button>
        </footer>
      </form>
    </dialog>
  );
}
