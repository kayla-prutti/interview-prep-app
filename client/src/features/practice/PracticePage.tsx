import { useState } from "react";
import { BinIcon, PenIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { interviewerLabel } from "../../lib/interviews";
import type { Question } from "../../types";

const ANSWERS_KEY = "i-prep-practice-answers";

type PracticePageProps = {
  questions: Question[];
  onBrowseQuestions: () => void;
  onRemoveQuestion: (questionId: number) => void;
};

function loadAnswers(): Record<number, string> {
  try {
    return JSON.parse(localStorage.getItem(ANSWERS_KEY) ?? "{}") as Record<number, string>;
  } catch {
    return {};
  }
}

export function PracticePage({ questions, onBrowseQuestions, onRemoveQuestion }: PracticePageProps) {
  const [answers, setAnswers] = useState<Record<number, string>>(loadAnswers);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");

  function openAnswerModal(question: Question) {
    setSelectedQuestion(question);
    setAnswerDraft(answers[question.id] ?? "");
  }

  function saveAnswer() {
    if (!selectedQuestion) return;
    const next = { ...answers, [selectedQuestion.id]: answerDraft.trim() };
    if (!next[selectedQuestion.id]) delete next[selectedQuestion.id];
    setAnswers(next);
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(next));
    setSelectedQuestion(null);
  }

  return (
    <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="practice">
      <PageHeader description="Read each question, form your answer, then reveal the saved reference answer to compare." eyebrow="Practice desk" title="Practice questions" />

      {questions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#BDBDB8] bg-white px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-[#202020]">Your practice list is empty</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#686868]">Choose questions from the Question Library using the “To practice” action.</p>
          <button className="mt-5 rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="button" onClick={onBrowseQuestions}>Browse questions</button>
        </div>
      ) : (
        <div className="mt-7 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)]">
          <ol className="divide-y divide-[#E4E4E1]">
            {questions.map((question, index) => {
              const answer = answers[question.id]?.trim();
              return (
                <li className="px-5 py-5 sm:px-6" key={question.id}>
                  <div className="flex items-start gap-4">
                    <span className="pt-1 text-sm font-semibold text-[#8A8A86]">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <button className="w-full text-left text-base font-semibold leading-7 text-[#202020] hover:text-[#C95712]" type="button" onClick={() => openAnswerModal(question)}>{question.question_text}</button>
                      <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#686868]">{question.company || "Unknown company"}{question.interviewer_type ? ` · ${interviewerLabel(question.interviewer_type)}` : ""}</p>

                      {answer ? (
                        <details className="mt-4 rounded-lg border border-[#D6D6D2] bg-[#FAFAF8]">
                          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#9A3D00]">Reveal saved answer</summary>
                          <div className="border-t border-[#D6D6D2] px-4 py-4 text-sm leading-6 text-[#303030] whitespace-pre-wrap">{answer}</div>
                        </details>
                      ) : (
                        <button className="mt-4 rounded-md border border-[#F5822A] px-3 py-2 text-xs font-bold text-[#9A3D00] hover:bg-[#FFE4D1]" type="button" onClick={() => openAnswerModal(question)}>Add reference answer</button>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button aria-label={answer ? "Edit answer" : "Add answer"} className="grid h-9 w-9 place-items-center rounded-md text-[#686868] hover:bg-[#FFE4D1] hover:text-[#C95712]" title={answer ? "Edit answer" : "Add answer"} type="button" onClick={() => openAnswerModal(question)}><PenIcon /></button>
                      <button aria-label="Remove from practice" className="grid h-9 w-9 place-items-center rounded-md text-[#686868] hover:bg-red-50 hover:text-red-700" title="Remove from practice" type="button" onClick={() => onRemoveQuestion(question.id)}><BinIcon /></button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <section aria-label="Practice answer" aria-modal="true" className="w-full max-w-2xl rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" role="dialog">
            <header className="border-b border-[#D6D6D2] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Reference answer</p>
              <h2 className="mt-2 text-xl font-bold leading-7 text-[#202020]">{selectedQuestion.question_text}</h2>
            </header>
            <label className="mt-5 grid gap-2 text-sm font-bold text-[#303030]">
              Answer
              <textarea autoFocus className="min-h-48 resize-y rounded-md border border-[#D6D6D2] px-4 py-3 font-normal leading-6 outline-none" placeholder="Write the answer you want to compare against during practice..." value={answerDraft} onChange={(event) => setAnswerDraft(event.target.value)} />
            </label>
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2]" type="button" onClick={() => setSelectedQuestion(null)}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="button" onClick={saveAnswer}>Save answer</button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
