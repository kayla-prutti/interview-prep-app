import { useState } from "react";
import { BinIcon, PenIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { interviewerLabel } from "../../lib/interviews";
import type { PracticeInterview, PracticeInterviewForm, PracticeQuestion } from "../../types";

type PracticePageProps = {
  activeInterviewId: number | null;
  interviews: PracticeInterview[];
  isLoadingQuestions: boolean;
  questions: PracticeQuestion[];
  onBrowseQuestions: () => void;
  onCreateInterview: (form: PracticeInterviewForm) => Promise<void>;
  onRemoveQuestion: (questionId: number) => Promise<void>;
  onSaveAnswer: (questionId: number, answer: string) => Promise<void>;
  onSelectInterview: (interviewId: number) => void;
};

const emptyPracticeForm: PracticeInterviewForm = {
  company: "",
  role: "",
  interviewer_type: "recruiter",
};

export function PracticePage({ activeInterviewId, interviews, isLoadingQuestions, questions, onBrowseQuestions, onCreateInterview, onRemoveQuestion, onSaveAnswer, onSelectInterview }: PracticePageProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PracticeInterviewForm>(emptyPracticeForm);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const activeInterview = interviews.find((interview) => interview.id === activeInterviewId) ?? null;

  function openAnswerModal(question: PracticeQuestion) {
    setSelectedQuestion(question);
    setAnswerDraft(question.answer ?? "");
    setModalError("");
  }

  async function createInterview() {
    setIsSaving(true);
    setModalError("");
    try {
      await onCreateInterview(createForm);
      setCreateForm(emptyPracticeForm);
      setIsCreateOpen(false);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Could not create the prep interview.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAnswer() {
    if (!selectedQuestion) return;
    setIsSaving(true);
    setModalError("");
    try {
      await onSaveAnswer(selectedQuestion.id, answerDraft);
      setSelectedQuestion(null);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Could not save the answer.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="practice">
      <PageHeader
        action={<button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] shadow-sm hover:bg-[#C95712] hover:text-white" type="button" onClick={() => setIsCreateOpen(true)}>+ New prep interview</button>}
        description="Create a prep interview, collect its questions, and reveal saved answers when you are ready to compare."
        eyebrow="Practice desk"
        title="Interview preparation"
      />

      {interviews.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#BDBDB8] bg-white px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-[#202020]">Create your first prep interview</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#686868]">Start with the company, role, and interview type. You can add questions from the library after it is created.</p>
          <button className="mt-5 rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="button" onClick={() => setIsCreateOpen(true)}>+ New prep interview</button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pb-5">
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {interviews.map((interview) => {
              const isActive = interview.id === activeInterviewId;
              return (
                <button className={`rounded-xl border p-4 text-left transition ${isActive ? "border-[#F5822A] bg-[#FFF0E5] shadow-sm" : "border-[#D6D6D2] bg-white hover:border-[#F5822A]"}`} key={interview.id} type="button" onClick={() => onSelectInterview(interview.id)}>
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#C95712]">{interviewerLabel(interview.interviewer_type)}</span>
                  <span className="mt-1 block text-lg font-bold text-[#202020]">{interview.company}</span>
                  <span className="mt-0.5 block text-sm text-[#686868]">{interview.role}</span>
                  <span className="mt-3 block text-xs font-medium text-[#686868]">{interview.answered_count} of {interview.question_count} answered</span>
                </button>
              );
            })}
          </div>

          {activeInterview ? (
            <section className="mt-5 overflow-hidden rounded-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)]">
              <header className="flex flex-col gap-4 border-b border-[#D6D6D2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C95712]">{interviewerLabel(activeInterview.interviewer_type)} prep</p>
                  <h2 className="mt-1 text-2xl font-bold text-[#202020]">{activeInterview.company} · {activeInterview.role}</h2>
                </div>
                <button className="rounded-md border border-[#F5822A] px-4 py-2 text-sm font-bold text-[#9A3D00] hover:bg-[#FFE4D1]" type="button" onClick={onBrowseQuestions}>+ Add questions</button>
              </header>

              {isLoadingQuestions ? (
                <p className="px-6 py-8 text-sm text-[#686868]">Loading practice questions...</p>
              ) : questions.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-[#686868]">This prep interview has no questions yet.</p>
                  <button className="mt-4 rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020]" type="button" onClick={onBrowseQuestions}>Choose from Question Library</button>
                </div>
              ) : (
                <ol className="divide-y divide-[#E4E4E1]">
                  {questions.map((question, index) => {
                    const answer = question.answer?.trim();
                    return (
                      <li className="px-5 py-5 sm:px-6" key={question.id}>
                        <div className="flex items-start gap-4">
                          <span className="pt-1 text-sm font-semibold text-[#8A8A86]">{String(index + 1).padStart(2, "0")}</span>
                          <div className="min-w-0 flex-1">
                            <button className="w-full text-left text-base font-semibold leading-7 text-[#202020] hover:text-[#C95712]" type="button" onClick={() => openAnswerModal(question)}>{question.question_text}</button>
                            {question.source_company && <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#686868]">From {question.source_company}</p>}
                            {answer ? (
                              <details className="mt-4 rounded-lg border border-[#D6D6D2] bg-[#FAFAF8]">
                                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#9A3D00]">Reveal saved answer</summary>
                                <div className="whitespace-pre-wrap border-t border-[#D6D6D2] px-4 py-4 text-sm leading-6 text-[#303030]">{answer}</div>
                              </details>
                            ) : (
                              <button className="mt-4 rounded-md border border-[#F5822A] px-3 py-2 text-xs font-bold text-[#9A3D00] hover:bg-[#FFE4D1]" type="button" onClick={() => openAnswerModal(question)}>Add reference answer</button>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button aria-label={answer ? "Edit answer" : "Add answer"} className="grid h-9 w-9 place-items-center rounded-md text-[#686868] hover:bg-[#FFE4D1] hover:text-[#C95712]" title={answer ? "Edit answer" : "Add answer"} type="button" onClick={() => openAnswerModal(question)}><PenIcon /></button>
                            <button aria-label="Remove from this prep interview" className="grid h-9 w-9 place-items-center rounded-md text-[#686868] hover:bg-red-50 hover:text-red-700" title="Remove from this prep interview" type="button" onClick={() => void onRemoveQuestion(question.id)}><BinIcon /></button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          ) : (
            <p className="mt-8 text-center text-sm text-[#686868]">Select a prep interview to view its questions.</p>
          )}
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <form className="w-full max-w-lg rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); void createInterview(); }}>
            <header className="border-b border-[#D6D6D2] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Practice setup</p>
              <h2 className="mt-1 text-2xl font-bold text-[#202020]">New prep interview</h2>
            </header>
            {modalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
            <label className="mt-5 grid gap-1.5 text-sm font-bold text-[#303030]">Company<input required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none" value={createForm.company} onChange={(event) => setCreateForm({ ...createForm, company: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-bold text-[#303030]">Role<input required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none" value={createForm.role} onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-bold text-[#303030]">Interview type<select className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none" value={createForm.interviewer_type} onChange={(event) => setCreateForm({ ...createForm, interviewer_type: event.target.value as PracticeInterviewForm["interviewer_type"] })}><option value="recruiter">Recruiter</option><option value="hiring_manager">Hiring manager</option><option value="technical">Technical</option></select></label>
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2]" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Creating..." : "Create prep interview"}</button>
            </footer>
          </form>
        </div>
      )}

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <section aria-label="Practice answer" aria-modal="true" className="w-full max-w-2xl rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" role="dialog">
            <header className="border-b border-[#D6D6D2] pb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Reference answer</p><h2 className="mt-2 text-xl font-bold leading-7 text-[#202020]">{selectedQuestion.question_text}</h2></header>
            {modalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
            <label className="mt-5 grid gap-2 text-sm font-bold text-[#303030]">Answer<textarea autoFocus className="min-h-48 resize-y rounded-md border border-[#D6D6D2] px-4 py-3 font-normal leading-6 outline-none" placeholder="Write the answer you want to compare against during practice..." value={answerDraft} onChange={(event) => setAnswerDraft(event.target.value)} /></label>
            <footer className="mt-6 flex justify-end gap-3"><button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2]" type="button" onClick={() => setSelectedQuestion(null)}>Cancel</button><button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:opacity-60" disabled={isSaving} type="button" onClick={() => void saveAnswer()}>{isSaving ? "Saving..." : "Save answer"}</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
