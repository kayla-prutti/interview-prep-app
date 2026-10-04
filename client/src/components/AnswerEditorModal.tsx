import { useState } from "react";

type AnswerEditorModalProps = {
  answer?: string;
  onClose: () => void;
  onSave: (answer: string) => Promise<void>;
  question: string;
};

export function AnswerEditorModal({ answer, onClose, onSave, question }: AnswerEditorModalProps) {
  const [draft, setDraft] = useState(answer ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      await onSave(draft);
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save the answer.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
      <section aria-label="Question answer" aria-modal="true" className="w-full max-w-2xl rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" role="dialog">
        <header className="border-b border-[#D6D6D2] pb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Reference answer</p><h2 className="mt-2 text-xl font-bold leading-7 text-[#202020]">{question}</h2></header>
        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <label className="mt-5 grid gap-2 text-sm font-bold text-[#303030]">Answer<textarea autoFocus className="min-h-48 resize-y rounded-md border border-[#D6D6D2] px-4 py-3 font-normal leading-6 outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" placeholder="Write the answer you want to compare against during practice..." value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
        <footer className="mt-6 flex justify-end gap-3"><button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2] disabled:opacity-60" disabled={isSaving} type="button" onClick={onClose}>Cancel</button><button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:opacity-60" disabled={isSaving} type="button" onClick={() => void save()}>{isSaving ? "Saving..." : "Save answer"}</button></footer>
      </section>
    </div>
  );
}
