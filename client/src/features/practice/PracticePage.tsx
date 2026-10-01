import { useState, type ReactNode } from "react";
import { FolderTabs, type FolderTab } from "../../components/FolderTabs";
import { BinIcon, PenIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { RequiredLabel } from "../../components/RequiredLabel";
import { interviewerLabel } from "../../lib/interviews";
import type { PracticeInterview, PracticeInterviewDetailsForm, PracticeInterviewForm, PracticeQuestion, PreparationNote, PreparationNoteForm } from "../../types";
import { NoteColorPicker } from "./NoteColorPicker";
import { PreparationNoteCard } from "./PreparationNoteCard";
import { PreparationNoteViewModal } from "./PreparationNoteViewModal";

type PreparationSection = "interviews" | "notes";

type PracticePageProps = {
  accountControl?: ReactNode;
  error: string;
  interviews: PracticeInterview[];
  isLoadingInterviews: boolean;
  isLoadingNotes: boolean;
  isLoadingQuestions: boolean;
  notes: PreparationNote[];
  notesError: string;
  questionsError: string;
  questions: PracticeQuestion[];
  onAddCustomQuestion: (interviewId: number, questionText: string) => Promise<void>;
  onBrowseQuestions: (interviewId: number) => void;
  onCreateInterview: (form: PracticeInterviewForm) => Promise<void>;
  onCreateNote: (form: PreparationNoteForm) => Promise<void>;
  onDeleteInterview: (interviewId: number) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
  onLoadNotes: () => void;
  onRemoveQuestion: (questionId: number) => Promise<void>;
  onRetry: () => Promise<void>;
  onSaveAnswer: (questionId: number, answer: string) => Promise<void>;
  onSelectInterview: (interviewId: number | null) => void;
  onUpdateNote: (noteId: number, form: PreparationNoteForm) => Promise<void>;
  onUpdateInterview: (interviewId: number, form: PracticeInterviewDetailsForm) => Promise<void>;
  onUpdateQuestion: (questionId: number, questionText: string) => Promise<void>;
};

const emptyPracticeForm: PracticeInterviewForm = {
  company: "",
  role: "",
  interviewer_type: "recruiter",
};

const emptyNoteForm: PreparationNoteForm = { title: "", content: "", color: "yellow" };
const preparationTabs: FolderTab<PreparationSection>[] = [
  { value: "interviews", label: "Interview prep" },
  { value: "notes", label: "Notes" },
];

export function PracticePage({ accountControl, error, interviews, isLoadingInterviews, isLoadingNotes, isLoadingQuestions, notes, notesError, questionsError, questions, onAddCustomQuestion, onBrowseQuestions, onCreateInterview, onCreateNote, onDeleteInterview, onDeleteNote, onLoadNotes, onRemoveQuestion, onRetry, onSaveAnswer, onSelectInterview, onUpdateInterview, onUpdateNote, onUpdateQuestion }: PracticePageProps) {
  const [activeSection, setActiveSection] = useState<PreparationSection>("interviews");
  const [openInterviewId, setOpenInterviewId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PracticeInterviewForm>(emptyPracticeForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [interviewToDelete, setInterviewToDelete] = useState<PracticeInterview | null>(null);
  const [interviewToEdit, setInterviewToEdit] = useState<PracticeInterview | null>(null);
  const [editInterviewForm, setEditInterviewForm] = useState<PracticeInterviewDetailsForm>({ company: "", role: "" });
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [customQuestionInterviewId, setCustomQuestionInterviewId] = useState<number | null>(null);
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [questionToEdit, setQuestionToEdit] = useState<PracticeQuestion | null>(null);
  const [questionEditText, setQuestionEditText] = useState("");
  const [pageError, setPageError] = useState("");
  const [removingQuestionIds, setRemovingQuestionIds] = useState<Set<number>>(new Set());
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<PreparationNote | null>(null);
  const [viewedNote, setViewedNote] = useState<PreparationNote | null>(null);
  const [noteForm, setNoteForm] = useState<PreparationNoteForm>(emptyNoteForm);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteModalError, setNoteModalError] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<PreparationNote | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const canCreateInterview = createForm.company.trim() !== ""
    && createForm.role.trim() !== ""
    && createForm.interviewer_type.trim() !== "";

  function openAnswerModal(question: PracticeQuestion) {
    setSelectedQuestion(question);
    setAnswerDraft(question.answer ?? "");
    setModalError("");
  }

  async function createInterview() {
    if (!canCreateInterview || isSaving) return;
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

  async function addCustomQuestion() {
    if (!customQuestionInterviewId || customQuestionText.trim() === "" || isSaving) return;
    setIsSaving(true);
    setModalError("");
    try {
      await onAddCustomQuestion(customQuestionInterviewId, customQuestionText.trim());
      setCustomQuestionInterviewId(null);
      setCustomQuestionText("");
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Could not add the custom question.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateCustomQuestion() {
    if (!questionToEdit || !questionEditText.trim() || isSaving) return;
    setIsSaving(true);
    setModalError("");
    try {
      await onUpdateQuestion(questionToEdit.id, questionEditText.trim());
      setQuestionToEdit(null);
      setQuestionEditText("");
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Could not update the custom question.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteInterview() {
    if (!interviewToDelete) return;
    setIsDeleting(true);
    setModalError("");
    try {
      await onDeleteInterview(interviewToDelete.id);
      if (openInterviewId === interviewToDelete.id) setOpenInterviewId(null);
      setInterviewToDelete(null);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Could not delete the prep interview.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function updateInterview() {
    if (!interviewToEdit || !editInterviewForm.company.trim() || !editInterviewForm.role.trim() || isSaving) return;
    setIsSaving(true);
    setModalError("");
    try {
      await onUpdateInterview(interviewToEdit.id, { company: editInterviewForm.company.trim(), role: editInterviewForm.role.trim() });
      setInterviewToEdit(null);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Could not update the prep interview.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeQuestion(questionId: number) {
    if (removingQuestionIds.has(questionId)) return;
    setPageError("");
    setRemovingQuestionIds((current) => new Set(current).add(questionId));
    try {
      await onRemoveQuestion(questionId);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not remove the question.");
    } finally {
      setRemovingQuestionIds((current) => {
        const next = new Set(current);
        next.delete(questionId);
        return next;
      });
    }
  }

  function openNoteModal(note: PreparationNote | null = null) {
    setSelectedNote(note);
    setNoteForm(note ? { title: note.title, content: note.content, color: note.color ?? "yellow" } : emptyNoteForm);
    setNoteModalError("");
    setIsNoteModalOpen(true);
  }

  async function saveNote() {
    if (!noteForm.title.trim() || !noteForm.content.trim() || isSavingNote) return;
    setIsSavingNote(true);
    setNoteModalError("");
    try {
      const normalized = { title: noteForm.title.trim(), content: noteForm.content.trim(), color: noteForm.color };
      if (selectedNote) await onUpdateNote(selectedNote.id, normalized);
      else await onCreateNote(normalized);
      setIsNoteModalOpen(false);
      setSelectedNote(null);
      setNoteForm(emptyNoteForm);
    } catch (error) {
      setNoteModalError(error instanceof Error ? error.message : "Could not save the note.");
    } finally {
      setIsSavingNote(false);
    }
  }

  async function deleteNote() {
    if (!noteToDelete || isDeletingNote) return;
    setIsDeletingNote(true);
    setNoteModalError("");
    try {
      await onDeleteNote(noteToDelete.id);
      setNoteToDelete(null);
    } catch (error) {
      setNoteModalError(error instanceof Error ? error.message : "Could not delete the note.");
    } finally {
      setIsDeletingNote(false);
    }
  }

  return (
    <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="practice">
      <PageHeader
        accountControl={accountControl}
        action={activeSection === "interviews"
          ? <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] shadow-sm hover:bg-[#C95712] hover:text-white" type="button" onClick={() => setIsCreateOpen(true)}>+ New prep interview</button>
          : <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] shadow-sm hover:bg-[#C95712] hover:text-white" type="button" onClick={() => openNoteModal()}>+ New note</button>}
        description="Organize interview practice and keep preparation notes in separate folders."
        eyebrow="Preparation desk"
        title="Interview preparation"
      />

      <div className="mt-7 md:mt-5">
        <FolderTabs
          activeValue={activeSection}
          ariaLabel="Preparation folders"
          panelId="preparation-folder-panel"
          tabs={preparationTabs}
          onChange={(section) => {
            setActiveSection(section);
            if (section === "notes") onLoadNotes();
          }}
        />
      </div>

      {activeSection === "interviews" ? (
      <div className="flex min-h-0 flex-1 flex-col" id="preparation-folder-panel" role="tabpanel">
      {(error || pageError) && (
        <div className="flex flex-col gap-3 rounded-b-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{pageError || error}</span>
          {error && <button className="w-fit shrink-0 cursor-pointer rounded-md border border-red-300 px-3 py-2 font-bold hover:bg-red-100 disabled:opacity-60" disabled={isLoadingInterviews} type="button" onClick={() => void onRetry()}>{isLoadingInterviews ? "Trying again..." : "Try again"}</button>}
        </div>
      )}

      {isLoadingInterviews && interviews.length === 0 ? (
        <div className="rounded-b-xl border border-[#D6D6D2] bg-white px-6 py-12 text-center text-sm font-semibold text-[#686868]">Loading prep interviews...</div>
      ) : !error && interviews.length === 0 ? (
        <div className="rounded-b-xl border border-dashed border-[#BDBDB8] bg-white px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-[#202020]">Create your first prep interview</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#686868]">Start with the company, role, and interview type. You can add questions from the library after it is created.</p>
          <button className="mt-5 rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="button" onClick={() => setIsCreateOpen(true)}>+ New prep interview</button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-b-xl border border-[#BDBDB8] bg-[#F4F4F2] p-4 pb-5">
            {interviews.map((interview) => {
              const isOpen = interview.id === openInterviewId;
              return (
                <article className={`rounded-xl border bg-white transition ${isOpen ? "border-[#F5822A] shadow-[0_14px_34px_rgba(32,32,32,0.08)]" : "border-[#D6D6D2] hover:border-[#BDBDB8]"}`} key={interview.id}>
                  <div className={`flex items-stretch rounded-t-xl transition ${isOpen ? "bg-[#FFF7F0]" : "rounded-b-xl hover:bg-[#FAFAF8]"}`}>
                    <button
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center justify-between gap-5 px-5 py-5 text-left sm:px-6"
                      type="button"
                      onClick={() => {
                        const nextInterviewId = isOpen ? null : interview.id;
                        setOpenInterviewId(nextInterviewId);
                        onSelectInterview(nextInterviewId);
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-[#C95712]">{interviewerLabel(interview.interviewer_type)} prep</span>
                        <span className="mt-1 block truncate text-xl font-bold text-[#202020]">{interview.company}</span>
                        <span className="mt-0.5 block truncate text-sm text-[#686868]">{interview.role}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-4">
                        <span className="hidden text-right sm:block">
                          <span className="block text-sm font-bold text-[#303030]">{interview.question_count} {interview.question_count === 1 ? "question" : "questions"}</span>
                          <span className="mt-0.5 block text-xs text-[#686868]">{interview.answered_count} answered</span>
                        </span>
                        <svg aria-hidden="true" className={`h-5 w-5 text-[#686868] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24">
                          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </span>
                    </button>
                    <div className="my-4 mr-4 flex shrink-0 items-center gap-1">
                      <button aria-label={`Edit ${interview.company} prep interview`} className="grid h-10 w-10 place-items-center rounded-md text-[#686868] hover:bg-[#FFE4D1] hover:text-[#C95712]" title="Edit prep interview" type="button" onClick={() => { setModalError(""); setInterviewToEdit(interview); setEditInterviewForm({ company: interview.company, role: interview.role }); }}><PenIcon /></button>
                      <button aria-label={`Delete ${interview.company} prep interview`} className="grid h-10 w-10 place-items-center rounded-md text-[#686868] hover:bg-red-50 hover:text-red-700" title="Delete prep interview" type="button" onClick={() => { setModalError(""); setInterviewToDelete(interview); }}><BinIcon /></button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#D6D6D2]">
                      {questionsError ? (
                        <div className="flex flex-col gap-3 bg-red-50 px-6 py-5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between" role="alert">
                          <span>{questionsError}</span>
                          <button className="w-fit shrink-0 rounded-md border border-red-300 px-3 py-2 font-bold hover:bg-red-100" type="button" onClick={() => onSelectInterview(interview.id)}>Try again</button>
                        </div>
                      ) : isLoadingQuestions ? (
                        <p className="px-6 py-8 text-sm text-[#686868]">Loading practice questions...</p>
                      ) : questions.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                          <p className="text-base font-semibold text-[#686868]">No questions</p>
                          <p className="mt-1 text-sm text-[#8A8A86]">Write a new question or choose one you have already saved.</p>
                          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                            <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="button" onClick={() => { setModalError(""); setCustomQuestionText(""); setCustomQuestionInterviewId(interview.id); }}>+ Custom question</button>
                            <button className="rounded-md border border-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#9A3D00] hover:bg-[#FFE4D1]" type="button" onClick={() => onBrowseQuestions(interview.id)}>Add from library</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-[#E4E4E1] bg-white/95 px-5 py-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#686868]">Selected questions</p>
                            <div className="flex flex-wrap gap-2">
                              <button className="rounded-md bg-[#F5822A] px-3 py-2 text-xs font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="button" onClick={() => { setModalError(""); setCustomQuestionText(""); setCustomQuestionInterviewId(interview.id); }}>+ Custom question</button>
                              <button className="rounded-md border border-[#F5822A] px-3 py-2 text-xs font-bold text-[#9A3D00] hover:bg-[#FFE4D1]" type="button" onClick={() => onBrowseQuestions(interview.id)}>Add from library</button>
                            </div>
                          </div>
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
                                          <div className="flex items-start gap-4 border-t border-[#D6D6D2] px-4 py-4">
                                            <div className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-[#303030]">{answer}</div>
                                            <button aria-label="Edit saved answer" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#686868] hover:bg-[#FFE4D1] hover:text-[#C95712]" title="Edit saved answer" type="button" onClick={() => openAnswerModal(question)}><PenIcon /></button>
                                          </div>
                                        </details>
                                      ) : (
                                        <button className="mt-4 rounded-md border border-[#F5822A] px-3 py-2 text-xs font-bold text-[#9A3D00] hover:bg-[#FFE4D1]" type="button" onClick={() => openAnswerModal(question)}>Add answer</button>
                                      )}
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                      {question.source_question_id === null && (
                                        <button aria-label="Edit custom question" className="grid h-9 w-9 place-items-center rounded-md text-[#686868] hover:bg-[#FFE4D1] hover:text-[#C95712]" title="Edit custom question" type="button" onClick={() => { setModalError(""); setQuestionToEdit(question); setQuestionEditText(question.question_text); }}><PenIcon /></button>
                                      )}
                                      <button aria-label={removingQuestionIds.has(question.id) ? "Removing question" : "Remove from this prep interview"} className="grid h-9 w-9 place-items-center rounded-md text-[#686868] hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-40" disabled={removingQuestionIds.has(question.id)} title="Remove from this prep interview" type="button" onClick={() => void removeQuestion(question.id)}><BinIcon /></button>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
        </div>
      )}
      </div>) : (
        <section className="relative z-20 flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-b-xl rounded-tr-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)]" id="preparation-folder-panel" role="tabpanel">
          <header className="flex shrink-0 items-start justify-between border-b border-[#D6D6D2] px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Preparation folder</p>
              <h2 className="mt-1 text-3xl font-bold text-[#202020]">Notes</h2>
              <p className="mt-2 text-sm text-[#686868]">Save research, reminders, stories, and talking points for future interviews.</p>
            </div>
          </header>

          {isLoadingNotes && <p className="px-6 py-8 text-sm text-[#686868]">Loading notes...</p>}
          {notesError && <div className="m-5 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between" role="alert"><span>{notesError}</span><button className="w-fit rounded-md border border-red-300 px-3 py-2 font-bold hover:bg-red-100" type="button" onClick={onLoadNotes}>Try again</button></div>}
          {!isLoadingNotes && !notesError && notes.length === 0 && (
            <div className="grid flex-1 place-items-center px-6 py-12 text-center">
              <div><h3 className="text-xl font-bold text-[#202020]">No notes yet</h3><p className="mt-2 text-sm text-[#686868]">Create a note for anything you want to remember while preparing.</p><button className="mt-5 rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="button" onClick={() => openNoteModal()}>+ New note</button></div>
            </div>
          )}
          {!isLoadingNotes && !notesError && notes.length > 0 && (
            <div className="grid min-h-0 flex-1 auto-rows-max gap-x-5 gap-y-7 overflow-y-auto bg-[#F4F4F2] p-6 pb-10 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note, index) => (
                <PreparationNoteCard
                  index={index}
                  key={note.id}
                  note={note}
                  onDelete={(selected) => { setNoteModalError(""); setNoteToDelete(selected); }}
                  onEdit={openNoteModal}
                  onView={setViewedNote}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <form className="w-full max-w-lg rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); void createInterview(); }}>
            <header className="border-b border-[#D6D6D2] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Preparation setup</p>
              <h2 className="mt-1 text-2xl font-bold text-[#202020]">New prep interview</h2>
            </header>
            {modalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
            <label className="mt-5 grid gap-1.5 text-sm font-bold text-[#303030]"><RequiredLabel>Company</RequiredLabel><input required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none" value={createForm.company} onChange={(event) => setCreateForm({ ...createForm, company: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-bold text-[#303030]"><RequiredLabel>Role</RequiredLabel><input required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none" value={createForm.role} onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-bold text-[#303030]"><RequiredLabel>Interview type</RequiredLabel><select required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none" value={createForm.interviewer_type} onChange={(event) => setCreateForm({ ...createForm, interviewer_type: event.target.value as PracticeInterviewForm["interviewer_type"] })}><option value="recruiter">Recruiter</option><option value="hiring_manager">Hiring manager</option><option value="technical">Technical</option></select></label>
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2]" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-not-allowed disabled:bg-[#D6D6D2] disabled:text-[#8A8A86]" disabled={isSaving || !canCreateInterview} type="submit">{isSaving ? "Creating..." : "Create prep interview"}</button>
            </footer>
          </form>
        </div>
      )}

      {interviewToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <section aria-label="Delete prep interview" aria-modal="true" className="w-full max-w-md rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" role="dialog">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Delete prep interview</p>
            <h2 className="mt-2 text-2xl font-bold text-[#202020]">Delete {interviewToDelete.company}?</h2>
            <p className="mt-3 text-sm leading-6 text-[#686868]">This will remove the prep interview, its selected questions, and its saved answers.</p>
            {modalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2]" disabled={isDeleting} type="button" onClick={() => setInterviewToDelete(null)}>Cancel</button>
              <button className="rounded-md bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60" disabled={isDeleting} type="button" onClick={() => void deleteInterview()}>{isDeleting ? "Deleting..." : "Delete prep interview"}</button>
            </footer>
          </section>
        </div>
      )}

      {interviewToEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <form className="w-full max-w-lg rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); void updateInterview(); }}>
            <header className="border-b border-[#D6D6D2] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Preparation setup</p>
              <h2 className="mt-1 text-2xl font-bold text-[#202020]">Edit prep interview</h2>
              <p className="mt-2 text-sm text-[#686868]">Questions and saved answers will stay with this preparation.</p>
            </header>
            {modalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{modalError}</p>}
            <label className="mt-5 grid gap-1.5 text-sm font-bold text-[#303030]"><RequiredLabel>Company</RequiredLabel><input autoFocus required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" value={editInterviewForm.company} onChange={(event) => setEditInterviewForm({ ...editInterviewForm, company: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-bold text-[#303030]"><RequiredLabel>Role</RequiredLabel><input required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" value={editInterviewForm.role} onChange={(event) => setEditInterviewForm({ ...editInterviewForm, role: event.target.value })} /></label>
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2] disabled:opacity-60" disabled={isSaving} type="button" onClick={() => setInterviewToEdit(null)}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-not-allowed disabled:bg-[#D6D6D2] disabled:text-[#8A8A86]" disabled={isSaving || !editInterviewForm.company.trim() || !editInterviewForm.role.trim()} type="submit">{isSaving ? "Saving..." : "Save changes"}</button>
            </footer>
          </form>
        </div>
      )}

      {customQuestionInterviewId && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <form className="w-full max-w-xl rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); void addCustomQuestion(); }}>
            <header className="border-b border-[#D6D6D2] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Custom preparation question</p>
              <h2 className="mt-1 text-2xl font-bold text-[#202020]">Add your own question</h2>
              <p className="mt-2 text-sm leading-6 text-[#686868]">This question belongs only to this prep interview. It will not be added to the Question Library.</p>
            </header>
            {modalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
            <label className="mt-5 grid gap-2 text-sm font-bold text-[#303030]"><RequiredLabel>Question</RequiredLabel><textarea autoFocus className="min-h-32 resize-y rounded-md border border-[#D6D6D2] px-4 py-3 font-normal leading-6 outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" placeholder="Type the question you want to practice..." value={customQuestionText} onChange={(event) => setCustomQuestionText(event.target.value)} /></label>
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2]" disabled={isSaving} type="button" onClick={() => { setCustomQuestionInterviewId(null); setCustomQuestionText(""); }}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-not-allowed disabled:bg-[#D6D6D2] disabled:text-[#8A8A86]" disabled={isSaving || customQuestionText.trim() === ""} type="submit">{isSaving ? "Adding..." : "Add custom question"}</button>
            </footer>
          </form>
        </div>
      )}

      {questionToEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <form className="w-full max-w-xl rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); void updateCustomQuestion(); }}>
            <header className="border-b border-[#D6D6D2] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Custom preparation question</p>
              <h2 className="mt-1 text-2xl font-bold text-[#202020]">Edit question</h2>
            </header>
            {modalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{modalError}</p>}
            <label className="mt-5 grid gap-2 text-sm font-bold text-[#303030]"><RequiredLabel>Question</RequiredLabel><textarea autoFocus required className="min-h-32 resize-y rounded-md border border-[#D6D6D2] px-4 py-3 font-normal leading-6 outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" value={questionEditText} onChange={(event) => setQuestionEditText(event.target.value)} /></label>
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2] disabled:opacity-60" disabled={isSaving} type="button" onClick={() => { setQuestionToEdit(null); setQuestionEditText(""); }}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-not-allowed disabled:bg-[#D6D6D2] disabled:text-[#8A8A86]" disabled={isSaving || !questionEditText.trim()} type="submit">{isSaving ? "Saving..." : "Save question"}</button>
            </footer>
          </form>
        </div>
      )}

      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <form className="w-full max-w-2xl rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); void saveNote(); }}>
            <header className="border-b border-[#D6D6D2] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Preparation notes</p>
              <h2 className="mt-1 text-2xl font-bold text-[#202020]">{selectedNote ? "Edit note" : "New note"}</h2>
            </header>
            {noteModalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{noteModalError}</p>}
            <NoteColorPicker value={noteForm.color} onChange={(color) => setNoteForm({ ...noteForm, color })} />
            <label className="mt-5 grid gap-1.5 text-sm font-bold text-[#303030]"><RequiredLabel>Title</RequiredLabel><input autoFocus required className="rounded-md border border-[#D6D6D2] px-3 py-2.5 font-normal outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" placeholder="Example: Questions to ask the hiring manager" value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-bold text-[#303030]"><RequiredLabel>Note</RequiredLabel><textarea required className="min-h-52 resize-y rounded-md border border-[#D6D6D2] px-4 py-3 font-normal leading-6 outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]" placeholder="Write the details you want to keep for preparation..." value={noteForm.content} onChange={(event) => setNoteForm({ ...noteForm, content: event.target.value })} /></label>
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2] disabled:opacity-60" disabled={isSavingNote} type="button" onClick={() => { setIsNoteModalOpen(false); setSelectedNote(null); setNoteForm(emptyNoteForm); }}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-not-allowed disabled:bg-[#D6D6D2] disabled:text-[#8A8A86]" disabled={isSavingNote || !noteForm.title.trim() || !noteForm.content.trim()} type="submit">{isSavingNote ? "Saving..." : selectedNote ? "Save changes" : "Create note"}</button>
            </footer>
          </form>
        </div>
      )}

      {viewedNote && (
        <PreparationNoteViewModal
          note={viewedNote}
          onClose={() => setViewedNote(null)}
          onEdit={(note) => { setViewedNote(null); openNoteModal(note); }}
        />
      )}

      {noteToDelete && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <section aria-label="Delete preparation note" aria-modal="true" className="w-full max-w-md rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" role="dialog">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Delete note</p>
            <h2 className="mt-2 text-2xl font-bold text-[#202020]">Delete “{noteToDelete.title}”?</h2>
            <p className="mt-3 text-sm leading-6 text-[#686868]">This note will be permanently removed.</p>
            {noteModalError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{noteModalError}</p>}
            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2] disabled:opacity-60" disabled={isDeletingNote} type="button" onClick={() => setNoteToDelete(null)}>Cancel</button>
              <button className="rounded-md bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60" disabled={isDeletingNote} type="button" onClick={() => void deleteNote()}>{isDeletingNote ? "Deleting..." : "Delete note"}</button>
            </footer>
          </section>
        </div>
      )}

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6">
          <section aria-label="Preparation answer" aria-modal="true" className="w-full max-w-2xl rounded-xl border border-[#D6D6D2] bg-white p-6 shadow-2xl" role="dialog">
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
