import {
  type FormEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DataTable } from "./components/DataTable";
import { FolderTabs, type FolderTab } from "./components/FolderTabs";
import { BinIcon, PenIcon } from "./components/Icons";
import { PageHeader } from "./components/PageHeader";
import { SearchField } from "./components/SearchField";
import { Sidebar } from "./components/Sidebar";
import { API_URL } from "./config";
import { interviewColumns } from "./features/interviews/columns";
import type { InterviewGridContext } from "./features/interviews/types";
import { questionColumns } from "./features/questions/columns";
import type { QuestionGridContext } from "./features/questions/types";
import { PracticePage } from "./features/practice/PracticePage";
import {
  emptyInterviewForm as emptyForm,
  formatDate,
  interviewSections,
  interviewerBadgeClass,
  interviewerLabel,
  questionLibrarySections,
} from "./lib/interviews";
import type {
  Interview,
  InterviewEditForm,
  InterviewFilter,
  InterviewForm,
  InterviewerType,
  Page,
  Question,
} from "./types";

function App() {
  const [page, setPage] = useState<Page>("interviews");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeInterviewType, setActiveInterviewType] = useState<InterviewFilter>("all");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [activeQuestionType, setActiveQuestionType] = useState<InterviewFilter>("all");
  const [practiceQuestionIds, setPracticeQuestionIds] = useState<Set<number>>(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem("i-prep-practice-questions") ?? "[]") as number[];
      return new Set(savedIds);
    } catch {
      return new Set();
    }
  });
  const [areQuestionsLoading, setAreQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<InterviewForm>(emptyForm);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editForm, setEditForm] = useState<InterviewEditForm | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  async function loadInterviews() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/interviews`);
      if (!response.ok) throw new Error("Could not load interviews.");
      setInterviews((await response.json()) as Interview[]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load interviews.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadQuestions() {
    setAreQuestionsLoading(true);
    setQuestionsError("");

    try {
      const response = await fetch(`${API_URL}/questions`);
      if (!response.ok) throw new Error("Could not load the question library.");
      setQuestions((await response.json()) as Question[]);
    } catch (caughtError) {
      setQuestionsError(caughtError instanceof Error ? caughtError.message : "Could not load the question library.");
    } finally {
      setAreQuestionsLoading(false);
    }
  }

  useEffect(() => {
    // Loading remote data on first render is the intended external synchronization.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadInterviews();
    void loadQuestions();
  }, []);

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return interviews.filter((interview) => {
      const matchesCompany = query === "" || interview.company.toLowerCase().includes(query);
      const matchesType = activeInterviewType === "all" || interview.interviewer_type === activeInterviewType;
      return matchesCompany && matchesType;
    });
  }, [activeInterviewType, interviews, search]);

  const activeInterviewSection = interviewSections.find((section) => section.type === activeInterviewType) ?? interviewSections[0];

  const filteredQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    return query === ""
      ? questions
      : questions.filter((question) =>
          [question.question_text, question.company, question.role]
            .some((value) => value?.toLowerCase().includes(query)),
        );
  }, [questionSearch, questions]);

  const activeQuestionSection = questionLibrarySections.find((section) => section.type === activeQuestionType) ?? questionLibrarySections[0];
  const activeQuestions = activeQuestionType === "all"
    ? filteredQuestions
    : filteredQuestions.filter((question) => question.interviewer_type === activeQuestionType);
  const practiceQuestions = questions.filter((question) => practiceQuestionIds.has(question.id));

  const questionRows = form.questions ?? [""];

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: modalPosition.x,
      y: modalPosition.y,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;

    setModalPosition({
      x: dragStart.current.x + event.clientX - dragStart.current.pointerX,
      y: dragStart.current.y + event.clientY - dragStart.current.pointerY,
    });
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function openInterview(interview: Interview, mode: "view" | "edit" = "view") {
    setSelectedInterview(interview);
    setSelectedQuestions([]);
    setDetailError("");
    setIsDetailLoading(true);
    setIsEditingDetail(mode === "edit");
    setEditForm({
      company: interview.company,
      role: interview.role,
      notes: interview.notes,
      interviewer_type: interview.interviewer_type,
      interview_date: interview.interview_date ?? "",
    });

    try {
      const response = await fetch(`${API_URL}/interviews/${interview.id}/questions`);
      if (!response.ok) throw new Error("Could not load this interview's questions.");
      setSelectedQuestions((await response.json()) as Question[]);
    } catch (caughtError) {
      setDetailError(caughtError instanceof Error ? caughtError.message : "Could not load this interview's questions.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function openDeleteConfirmation(interview: Interview) {
    setSelectedInterview(interview);
    setEditForm(null);
    setDetailError("");
    setIsDeleteModalOpen(true);
  }

  async function saveInterviewDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInterview || !editForm) return;

    setDetailError("");

    try {
      const response = await fetch(`${API_URL}/interviews/${selectedInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = (await response.json()) as Interview | { error: string };

      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Could not update interview.");
      }

      setInterviews((current) => current.map((interview) => interview.id === result.id ? result : interview));
      setSelectedInterview(result);
      setIsEditingDetail(false);
      void loadQuestions();
    } catch (caughtError) {
      setDetailError(caughtError instanceof Error ? caughtError.message : "Could not update interview.");
    }
  }

  async function deleteInterview() {
    if (!selectedInterview) return;

    setDetailError("");

    try {
      const response = await fetch(`${API_URL}/interviews/${selectedInterview.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete interview.");

      setInterviews((current) => current.filter((interview) => interview.id !== selectedInterview.id));
      setIsDeleteModalOpen(false);
      setSelectedInterview(null);
      void loadQuestions();
    } catch (caughtError) {
      setDetailError(caughtError instanceof Error ? caughtError.message : "Could not delete interview.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const { questions, ...interviewDetails } = form;
      const response = await fetch(`${API_URL}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(interviewDetails),
      });
      const result = (await response.json()) as Interview | { error: string };

      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Could not save interview.");
      }

      const questionsToSave = (questions ?? [])
        .map((question) => question.trim())
        .filter((question) => question !== "");

      await Promise.all(
        questionsToSave.map(async (question_text) => {
          const questionResponse = await fetch(
            `${API_URL}/interviews/${result.id}/questions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ question_text }),
            },
          );

          if (!questionResponse.ok) {
            throw new Error("The interview was saved, but one of its questions was not.");
          }
        }),
      );

      setInterviews((current) => [result, ...current]);
      setForm(emptyForm);
      setIsModalOpen(false);
      void loadQuestions();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save interview.");
    } finally {
      setIsSaving(false);
    }
  }

  const gridContext: InterviewGridContext = {
    onView: (interview) => void openInterview(interview),
    onEdit: (interview) => void openInterview(interview, "edit"),
    onDelete: openDeleteConfirmation,
  };

  function togglePracticeQuestion(questionId: number) {
    setPracticeQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      localStorage.setItem("i-prep-practice-questions", JSON.stringify([...next]));
      return next;
    });
  }

  const questionGridContext: QuestionGridContext = {
    isAddedToPractice: (questionId) => practiceQuestionIds.has(questionId),
    onTogglePractice: togglePracticeQuestion,
  };

  const interviewTabs: FolderTab<InterviewFilter>[] = interviewSections.map((section) => ({
    value: section.type,
    label: section.title,
    count: section.type === "all"
      ? interviews.length
      : interviews.filter((interview) => interview.interviewer_type === section.type).length,
  }));

  const questionTabs: FolderTab<InterviewFilter>[] = questionLibrarySections.map((section) => ({
    value: section.type,
    label: section.title,
    count: section.type === "all"
      ? filteredQuestions.length
      : filteredQuestions.filter((question) => question.interviewer_type === section.type).length,
  }));

  return (
    <div className={`flex h-[100dvh] w-full flex-col overflow-hidden bg-[#F4F4F2] text-[#202020] transition-[grid-template-columns] duration-200 md:grid ${isSidebarCollapsed ? "md:grid-cols-[76px_minmax(0,1fr)]" : "md:grid-cols-[238px_minmax(0,1fr)]"}`}>
      <Sidebar
        activePage={page}
        collapsed={isSidebarCollapsed}
        practiceCount={practiceQuestions.length}
        onCollapseChange={setIsSidebarCollapsed}
        onPageChange={setPage}
      />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 pb-9 sm:px-9 md:pb-5 lg:px-10" id="top">
        {page === "interviews" ? (
          <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="interviews">
            <PageHeader
              action={(
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] shadow-sm hover:bg-[#C95712] hover:text-white" type="button" onClick={() => { setForm(emptyForm); setModalPosition({ x: 0, y: 0 }); setIsModalOpen(true); }}>
                + New interview
              </button>
              )}
              description="Record each conversation and return to the details when it is time to prepare again."
              eyebrow="Interview archive"
              title="Interview experiences"
            />

            <div className="min-h-0 flex-1 md:flex md:flex-col">
            <SearchField ariaLabel="Search by company name" className="mt-7 md:mt-5" placeholder="Search by company name" value={search} onChange={setSearch} onClear={() => setSearch("")} />

            <div className="mt-7 md:mt-5">
              <FolderTabs activeValue={activeInterviewType} ariaLabel="Interview folders" countLabel="interviews" panelId="interview-folder-panel" tabs={interviewTabs} onChange={setActiveInterviewType} />
            </div>

            <section className="relative z-20 flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-b-xl rounded-tr-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)]" id="interview-folder-panel" role="tabpanel">
              <header className="flex shrink-0 items-center justify-between border-b border-[#D6D6D2] px-5 py-3.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C95712]">Interview folder</p>
                  <h2 className="mt-0.5 text-lg font-bold text-[#202020]">{activeInterviewSection.title} interviews</h2>
                </div>
              </header>

              {isLoading && <p className="p-5 text-sm text-stone-500">Loading interviews...</p>}
              {error && <p className="m-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
              {!isLoading && !error && filteredInterviews.length === 0 && <p className="p-5 text-sm text-stone-500">No interviews match this folder and company search.</p>}

              {!isLoading && !error && filteredInterviews.length > 0 && (
                <DataTable columns={interviewColumns} context={gridContext} rows={filteredInterviews} />
              )}
            </section>
            </div>
          </section>
        ) : page === "questions" ? (
          <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="questions">
            <PageHeader description="Browse every saved question by the kind of conversation where it appeared." eyebrow="Reference collection" title="Question library" />

            <SearchField ariaLabel="Search the question library" className="mt-7 md:mt-5" placeholder="Search questions, companies, or roles" value={questionSearch} onChange={setQuestionSearch} onClear={() => setQuestionSearch("")} />

            {areQuestionsLoading && <p className="mt-6 border-y border-stone-300 py-5 text-sm text-stone-500">Opening the question library...</p>}
            {questionsError && <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{questionsError}</p>}

            {!areQuestionsLoading && !questionsError && (
              <div className="mt-10 min-w-0 md:mt-5 md:flex md:min-h-0 md:flex-1 md:flex-col">
                <FolderTabs activeValue={activeQuestionType} ariaLabel="Interview type folders" countLabel="questions" panelId="question-folder-panel" tabs={questionTabs} onChange={setActiveQuestionType} />

                <section className="relative z-20 flex min-h-[420px] flex-col overflow-hidden rounded-b-xl rounded-tr-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)] md:min-h-0 md:flex-1" id="question-folder-panel" role="tabpanel">
                  <header className="flex shrink-0 flex-col gap-3 border-b border-[#D6D6D2] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Interview type folder</p>
                      <h2 className="mt-1 text-3xl font-bold text-[#202020]">{activeQuestionSection.title}</h2>
                      <p className="mt-2 text-sm text-[#686868]">{activeQuestionSection.description}</p>
                    </div>
                  </header>

                  {activeQuestions.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-[#686868]">No matching questions in this folder.</p>
                  ) : (
                    <DataTable columns={questionColumns} context={questionGridContext} refreshKey={practiceQuestionIds} rows={activeQuestions} />
                  )}
                </section>
              </div>
            )}
          </section>
        ) : (
          <PracticePage
            questions={practiceQuestions}
            onBrowseQuestions={() => setPage("questions")}
            onRemoveQuestion={togglePracticeQuestion}
          />
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 grid place-items-center overflow-auto bg-slate-950/35 px-5 py-12">
          <form className="w-full max-w-2xl rounded-md border border-[#D6D6D2] bg-white p-6 shadow-2xl" onSubmit={handleSubmit} style={{ transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)` }}>
            <header className="cursor-grab select-none active:cursor-grabbing" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-slate-400" aria-hidden="true">⠿</span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#202020]">Record an interview</h2>
                  <p className="mt-1 text-sm text-slate-600">Save the context first. Questions come next.</p>
                </div>
              </div>
            </header>

            <label className="mt-5 grid gap-1.5 text-sm font-medium text-slate-700">Company<input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Role<input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Interviewer type<select className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.interviewer_type} onChange={(event) => setForm({ ...form, interviewer_type: event.target.value as InterviewerType })}><option value="technical">Technical</option><option value="recruiter">Recruiter</option><option value="hiring_manager">Hiring manager</option></select></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Interview date<input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="date" value={form.interview_date} onChange={(event) => setForm({ ...form, interview_date: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Notes<textarea required className="min-h-24 rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>

            <fieldset className="mt-5 border-t border-slate-200 pt-5">
              <legend className="text-sm font-semibold text-slate-900">Questions asked</legend>
              <p className="mt-1 text-sm text-slate-600">Write each question as closely as you remember it.</p>

              <div className="mt-3 grid gap-2.5">
                {questionRows.map((question, index) => (
                  <div className="flex gap-2" key={index}>
                    <input
                      required={index === 0}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder={`Question ${index + 1}`}
                      value={question}
                      onChange={(event) => {
                        const nextQuestions = [...questionRows];
                        nextQuestions[index] = event.target.value;
                        setForm({ ...form, questions: nextQuestions });
                      }}
                    />
                    {index > 0 && (
                      <button
                        className="rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        type="button"
                        onClick={() => setForm({ ...form, questions: questionRows.filter((_, itemIndex) => itemIndex !== index) })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="mt-3 text-sm font-semibold text-[#C95712] hover:text-[#9A3D00]"
                type="button"
                onClick={() => setForm({ ...form, questions: [...questionRows, ""] })}
              >
                + Add question row
              </button>
            </fieldset>

            <footer className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-wait disabled:opacity-70" disabled={isSaving}>{isSaving ? "Saving..." : "Save interview"}</button>
            </footer>
          </form>
        </div>
      )}

      {selectedInterview && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 sm:p-6">
          <section className="flex h-[calc(100dvh-2rem)] max-h-[44rem] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-[#D6D6D2] bg-white p-6 shadow-2xl sm:h-[calc(100dvh-3rem)]" aria-label="Interview details" aria-modal="true" role="dialog">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Interview details</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#202020]">{selectedInterview.company}</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedInterview.role} · {selectedInterview.interview_date ? formatDate(selectedInterview.interview_date) : formatDate(selectedInterview.created_at)}</p>
              </div>
              <button className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100" type="button" onClick={() => setSelectedInterview(null)}>Close</button>
            </header>

            {detailError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{detailError}</p>}

            {!isEditingDetail ? (
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${interviewerBadgeClass(selectedInterview.interviewer_type)}`}>
                    {interviewerLabel(selectedInterview.interviewer_type)}
                  </span>
                  <div className="flex gap-2">
                    <button aria-label="Edit interview" className="grid h-9 w-9 place-items-center rounded-md border border-[#D6D6D2] text-stone-600 hover:bg-[#FFE4D1] hover:text-[#C95712]" title="Edit interview" type="button" onClick={() => setIsEditingDetail(true)}><PenIcon /></button>
                    <button aria-label="Delete interview" className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" title="Delete interview" type="button" onClick={() => setIsDeleteModalOpen(true)}><BinIcon /></button>
                  </div>
                </div>

                <section className="mt-6">
                  <h3 className="text-sm font-semibold">Notes</h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selectedInterview.notes}</p>
                </section>

                <section className="mt-6">
                  <h3 className="text-sm font-semibold">Questions asked</h3>
                  {isDetailLoading && <p className="mt-3 text-sm text-slate-500">Loading questions...</p>}
                  {!isDetailLoading && selectedQuestions.length === 0 && <p className="mt-3 text-sm text-slate-500">No questions were saved for this interview.</p>}
                  <ol className="mt-3 grid gap-2">
                    {selectedQuestions.map((question, index) => (
                      <li className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700" key={question.id}>
                        <span className="mr-2 text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                        {question.question_text}
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            ) : (
              <form className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1" onSubmit={saveInterviewDetail}>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">Company<input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.company} onChange={(event) => setEditForm({ ...editForm, company: event.target.value })} /></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Role<input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })} /></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Interviewer type<select className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.interviewer_type} onChange={(event) => setEditForm({ ...editForm, interviewer_type: event.target.value as InterviewerType })}><option value="technical">Technical</option><option value="recruiter">Recruiter</option><option value="hiring_manager">Hiring manager</option></select></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Interview date<input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="date" value={editForm.interview_date} onChange={(event) => setEditForm({ ...editForm, interview_date: event.target.value })} /></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">Notes<textarea required className="min-h-28 rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></label>
                <footer className="mt-6 flex justify-end gap-3"><button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-[#F4F4F2]" type="button" onClick={() => setIsEditingDetail(false)}>Cancel</button><button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white" type="submit">Save changes</button></footer>
              </form>
            )}
          </section>
        </div>
      )}

      {isDeleteModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 px-5">
          <section className="w-full max-w-md rounded-md border border-[#D6D6D2] bg-white p-6 shadow-2xl" aria-label="Delete interview confirmation">
            <p className="text-sm font-semibold text-red-700">Delete interview</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202020]">Remove {selectedInterview.company}?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This will permanently remove the interview and every question saved under it.
            </p>
            {detailError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{detailError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => { setIsDeleteModalOpen(false); if (!editForm) setSelectedInterview(null); }}>Cancel</button>
              <button className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700" type="button" onClick={() => void deleteInterview()}>Delete interview</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
