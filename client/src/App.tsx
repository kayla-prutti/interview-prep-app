import {
  type FormEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { apiFetch } from "./api";
import { AccountMenu } from "./components/AccountMenu";
import { DataTable } from "./components/DataTable";
import { FolderTabs, type FolderTab } from "./components/FolderTabs";
import { BinIcon, PenIcon } from "./components/Icons";
import { PageHeader } from "./components/PageHeader";
import { RequiredLabel } from "./components/RequiredLabel";
import { SearchField } from "./components/SearchField";
import { Sidebar } from "./components/Sidebar";
import { WelcomeModal } from "./components/WelcomeModal";
import { API_URL } from "./config";
import { interviewColumns } from "./features/interviews/columns";
import type { InterviewGridContext } from "./features/interviews/types";
import { questionColumns } from "./features/questions/columns";
import type { QuestionGridContext } from "./features/questions/types";
import { PracticePage } from "./features/practice/PracticePage";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { createPageCacheKey, PageCache } from "./lib/PageCache";
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
  PracticeInterview,
  PracticeInterviewForm,
  PracticeQuestion,
  Question,
} from "./types";

type AppProps = {
  accountEmail?: string;
  onSignOut?: () => Promise<void>;
};

type EditableInterviewQuestion = {
  id: number | null;
  question_text: string;
};

type TypeCounts = Record<InterviewFilter, number>;
type PagedResult<Item> = { items: Item[]; total: number; counts: TypeCounts };
const emptyTypeCounts: TypeCounts = { all: 0, recruiter: 0, hiring_manager: 0, technical: 0 };

function App({ accountEmail, onSignOut }: AppProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(() => localStorage.getItem("i-prep-guide-seen-v1") !== "true");
  const [page, setPage] = useState<Page>("interviews");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeInterviewType, setActiveInterviewType] = useState<InterviewFilter>("all");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewTotal, setInterviewTotal] = useState(0);
  const [interviewCounts, setInterviewCounts] = useState<TypeCounts>(emptyTypeCounts);
  const [interviewPage, setInterviewPage] = useState(0);
  const [interviewPageSize, setInterviewPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [questionCounts, setQuestionCounts] = useState<TypeCounts>(emptyTypeCounts);
  const [questionPage, setQuestionPage] = useState(0);
  const [questionPageSize, setQuestionPageSize] = useState(10);
  const [questionSearch, setQuestionSearch] = useState("");
  const [activeQuestionType, setActiveQuestionType] = useState<InterviewFilter>("all");
  const [practiceInterviews, setPracticeInterviews] = useState<PracticeInterview[]>([]);
  const [activePracticeId, setActivePracticeId] = useState<number | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [pendingPracticeAdds, setPendingPracticeAdds] = useState<Set<string>>(() => new Set());
  const [arePracticeQuestionsLoading, setArePracticeQuestionsLoading] = useState(false);
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
  const [editQuestions, setEditQuestions] = useState<EditableInterviewQuestion[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editForm, setEditForm] = useState<InterviewEditForm | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const interviewRequest = useRef(0);
  const questionRequest = useRef(0);
  const interviewPageCache = useRef(new PageCache<PagedResult<Interview>>());
  const questionPageCache = useRef(new PageCache<PagedResult<Question>>());
  const pendingPracticeAddsRef = useRef(new Set<string>());
  const debouncedSearch = useDebouncedValue(search);
  const debouncedQuestionSearch = useDebouncedValue(questionSearch);

  const loadInterviews = useCallback(async () => {
    const requestId = ++interviewRequest.current;
    const cacheKey = createPageCacheKey({ page: interviewPage, pageSize: interviewPageSize, search: debouncedSearch, type: activeInterviewType });
    const cached = interviewPageCache.current.get(cacheKey);
    if (cached) {
      setInterviews(cached.items);
      setInterviewTotal(cached.total);
      setInterviewCounts(cached.counts);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const parameters = new URLSearchParams({ offset: String(interviewPage * interviewPageSize), limit: String(interviewPageSize), search: debouncedSearch, type: activeInterviewType });
      const result = await interviewPageCache.current.load(cacheKey, async () => {
        const response = await apiFetch(`${API_URL}/interviews/page?${parameters}`);
        if (!response.ok) throw new Error("Could not load interviews.");
        return (await response.json()) as PagedResult<Interview>;
      });
      if (requestId !== interviewRequest.current) return;
      setInterviews(result.items);
      setInterviewTotal(result.total);
      setInterviewCounts(result.counts);
    } catch (caughtError) {
      if (requestId !== interviewRequest.current) return;
      setError(caughtError instanceof Error ? caughtError.message : "Could not load interviews.");
    } finally {
      if (requestId === interviewRequest.current) setIsLoading(false);
    }
  }, [activeInterviewType, debouncedSearch, interviewPage, interviewPageSize]);

  const loadQuestions = useCallback(async () => {
    const requestId = ++questionRequest.current;
    const cacheKey = createPageCacheKey({ page: questionPage, pageSize: questionPageSize, search: debouncedQuestionSearch, type: activeQuestionType });
    const cached = questionPageCache.current.get(cacheKey);
    if (cached) {
      setQuestions(cached.items);
      setQuestionTotal(cached.total);
      setQuestionCounts(cached.counts);
      setQuestionsError("");
      setAreQuestionsLoading(false);
      return;
    }

    setAreQuestionsLoading(true);
    setQuestionsError("");
    try {
      const parameters = new URLSearchParams({ offset: String(questionPage * questionPageSize), limit: String(questionPageSize), search: debouncedQuestionSearch, type: activeQuestionType });
      const result = await questionPageCache.current.load(cacheKey, async () => {
        const response = await apiFetch(`${API_URL}/questions/page?${parameters}`);
        if (!response.ok) throw new Error("Could not load the question library.");
        return (await response.json()) as PagedResult<Question>;
      });
      if (requestId !== questionRequest.current) return;
      setQuestions(result.items);
      setQuestionTotal(result.total);
      setQuestionCounts(result.counts);
    } catch (caughtError) {
      if (requestId !== questionRequest.current) return;
      setQuestionsError(caughtError instanceof Error ? caughtError.message : "Could not load the question library.");
    } finally {
      if (requestId === questionRequest.current) setAreQuestionsLoading(false);
    }
  }, [activeQuestionType, debouncedQuestionSearch, questionPage, questionPageSize]);

  const loadPracticeInterviews = useCallback(async () => {
    const response = await apiFetch(`${API_URL}/practice-interviews`);
    if (!response.ok) throw new Error("Could not load prep interviews.");
    setPracticeInterviews((await response.json()) as PracticeInterview[]);
  }, []);

  const loadPracticeQuestions = useCallback(async (practiceInterviewId: number) => {
    setArePracticeQuestionsLoading(true);
    try {
      const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}/questions`);
      if (!response.ok) throw new Error("Could not load practice questions.");
      setPracticeQuestions((await response.json()) as PracticeQuestion[]);
    } finally {
      setArePracticeQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loading remote data on first render is the intended external synchronization.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPracticeInterviews();
  }, [loadPracticeInterviews]);

  useEffect(() => {
    if (page !== "interviews") return;
    // Fetching the active server-side page keeps the UI synchronized with remote data.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadInterviews();
  }, [loadInterviews, page]);

  useEffect(() => {
    if (page !== "questions") return;
    // Fetching the active server-side page keeps the UI synchronized with remote data.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadQuestions();
  }, [loadQuestions, page]);

  const activeInterviewSection = interviewSections.find((section) => section.type === activeInterviewType) ?? interviewSections[0];

  const activeQuestionSection = questionLibrarySections.find((section) => section.type === activeQuestionType) ?? questionLibrarySections[0];
  const practiceSourceQuestionIds = new Set(practiceQuestions.map((question) => question.source_question_id).filter((id): id is number => id !== null));

  const questionRows = form.questions ?? [""];
  const canSaveInterview = form.company.trim() !== ""
    && form.role.trim() !== ""
    && form.interviewer_type.trim() !== ""
    && form.interview_date.trim() !== ""
    && questionRows.some((question) => question.trim() !== "");

  function closeGuide() {
    localStorage.setItem("i-prep-guide-seen-v1", "true");
    setIsGuideOpen(false);
  }

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
    setEditQuestions([]);
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
      const response = await apiFetch(`${API_URL}/interviews/${interview.id}/questions`);
      if (!response.ok) throw new Error("Could not load this interview's questions.");
      const interviewQuestions = (await response.json()) as Question[];
      setSelectedQuestions(interviewQuestions);
      setEditQuestions(interviewQuestions.map((question) => ({ id: question.id, question_text: question.question_text })));
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
    setIsSaving(true);

    try {
      const response = await apiFetch(`${API_URL}/interviews/${selectedInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = (await response.json()) as Interview | { error: string };

      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Could not update interview.");
      }

      const savedQuestionIds = new Set(editQuestions.flatMap((question) => question.id === null || question.question_text.trim() === "" ? [] : [question.id]));
      const originalQuestions = new Map(selectedQuestions.map((question) => [question.id, question]));
      const questionRequests: Promise<Response>[] = [];

      for (const question of selectedQuestions) {
        if (!savedQuestionIds.has(question.id)) {
          questionRequests.push(apiFetch(`${API_URL}/questions/${question.id}`, { method: "DELETE" }));
        }
      }

      for (const question of editQuestions) {
        const questionText = question.question_text.trim();
        if (!questionText) continue;
        if (question.id === null) {
          questionRequests.push(apiFetch(`${API_URL}/interviews/${selectedInterview.id}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question_text: questionText }),
          }));
        } else if (originalQuestions.get(question.id)?.question_text !== questionText) {
          questionRequests.push(apiFetch(`${API_URL}/questions/${question.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question_text: questionText }),
          }));
        }
      }

      const questionResponses = await Promise.all(questionRequests);
      if (questionResponses.some((questionResponse) => !questionResponse.ok)) {
        throw new Error("The interview details were saved, but its questions could not all be updated.");
      }

      const refreshedQuestionsResponse = await apiFetch(`${API_URL}/interviews/${selectedInterview.id}/questions`);
      if (!refreshedQuestionsResponse.ok) throw new Error("The interview was saved, but its questions could not be refreshed.");
      const refreshedQuestions = (await refreshedQuestionsResponse.json()) as Question[];

      setInterviews((current) => current.map((interview) => interview.id === result.id ? result : interview));
      setSelectedInterview(result);
      setSelectedQuestions(refreshedQuestions);
      setEditQuestions(refreshedQuestions.map((question) => ({ id: question.id, question_text: question.question_text })));
      setIsEditingDetail(false);
      interviewPageCache.current.clear();
      questionPageCache.current.clear();
      void loadInterviews();
    } catch (caughtError) {
      setDetailError(caughtError instanceof Error ? caughtError.message : "Could not update interview.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteInterview() {
    if (!selectedInterview) return;

    setDetailError("");

    try {
      const response = await apiFetch(`${API_URL}/interviews/${selectedInterview.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete interview.");

      setInterviews((current) => current.filter((interview) => interview.id !== selectedInterview.id));
      setInterviewPage(0);
      setIsDeleteModalOpen(false);
      setSelectedInterview(null);
      interviewPageCache.current.clear();
      questionPageCache.current.clear();
      if (interviewPage === 0) void loadInterviews();
    } catch (caughtError) {
      setDetailError(caughtError instanceof Error ? caughtError.message : "Could not delete interview.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSaveInterview || isSaving) return;
    setIsSaving(true);
    setError("");

    try {
      const { questions, ...interviewDetails } = form;
      const response = await apiFetch(`${API_URL}/interviews`, {
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
          const questionResponse = await apiFetch(
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

      setInterviewPage(0);
      setForm(emptyForm);
      setIsModalOpen(false);
      interviewPageCache.current.clear();
      questionPageCache.current.clear();
      if (interviewPage === 0) void loadInterviews();
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

  function selectPracticeInterview(practiceInterviewId: number | null) {
    setActivePracticeId(practiceInterviewId);
    setPracticeQuestions([]);
    if (practiceInterviewId) void loadPracticeQuestions(practiceInterviewId);
  }

  async function createPracticeInterview(practiceForm: PracticeInterviewForm) {
    const response = await apiFetch(`${API_URL}/practice-interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(practiceForm),
    });
    const result = (await response.json()) as PracticeInterview | { error: string };
    if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "Could not create the prep interview.");
    setPracticeInterviews((current) => [result, ...current]);
    setActivePracticeId(result.id);
    setPracticeQuestions([]);
  }

  async function deletePracticeInterview(practiceInterviewId: number) {
    const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Could not delete the prep interview.");
    setPracticeInterviews((current) => current.filter((interview) => interview.id !== practiceInterviewId));
    if (activePracticeId === practiceInterviewId) {
      setActivePracticeId(null);
      setPracticeQuestions([]);
    }
  }

  async function addQuestionToPractice(questionId: number) {
    if (!activePracticeId) return;
    const practiceInterviewId = activePracticeId;
    const pendingKey = `${practiceInterviewId}:${questionId}`;
    if (pendingPracticeAddsRef.current.has(pendingKey)) return;
    pendingPracticeAddsRef.current.add(pendingKey);
    setPendingPracticeAdds(new Set(pendingPracticeAddsRef.current));

    try {
      const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_question_id: questionId }),
      });
      const result = (await response.json()) as PracticeQuestion | { error: string };
      if (response.status !== 409 && (!response.ok || "error" in result)) throw new Error("error" in result ? result.error : "Could not add the question.");
      await Promise.all([loadPracticeQuestions(practiceInterviewId), loadPracticeInterviews()]);
    } finally {
      pendingPracticeAddsRef.current.delete(pendingKey);
      setPendingPracticeAdds(new Set(pendingPracticeAddsRef.current));
    }
  }

  async function savePracticeAnswer(practiceQuestionId: number, answer: string) {
    if (!activePracticeId) return;
    const response = await apiFetch(`${API_URL}/practice-interviews/${activePracticeId}/questions/${practiceQuestionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const result = (await response.json()) as PracticeQuestion | { error: string };
    if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "Could not save the answer.");
    setPracticeQuestions((current) => current.map((question) => question.id === result.id ? { ...question, ...result } : question));
    await loadPracticeInterviews();
  }

  async function removePracticeQuestion(practiceQuestionId: number) {
    if (!activePracticeId) return;
    const response = await apiFetch(`${API_URL}/practice-interviews/${activePracticeId}/questions/${practiceQuestionId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Could not remove the question from this prep interview.");
    setPracticeQuestions((current) => current.filter((question) => question.id !== practiceQuestionId));
    await loadPracticeInterviews();
  }

  const questionGridContext: QuestionGridContext = {
    canAddToPractice: activePracticeId !== null,
    isAddedToPractice: (questionId) => practiceSourceQuestionIds.has(questionId),
    isAddingToPractice: (questionId) => activePracticeId !== null && pendingPracticeAdds.has(`${activePracticeId}:${questionId}`),
    onAddToPractice: (questionId) => void addQuestionToPractice(questionId).catch((caughtError) => setQuestionsError(caughtError instanceof Error ? caughtError.message : "Could not add the question.")),
  };

  const interviewTabs: FolderTab<InterviewFilter>[] = interviewSections.map((section) => ({
    value: section.type,
    label: section.title,
    count: interviewCounts[section.type],
  }));

  const questionTabs: FolderTab<InterviewFilter>[] = questionLibrarySections.map((section) => ({
    value: section.type,
    label: section.title,
    count: questionCounts[section.type],
  }));

  const accountControl = accountEmail && onSignOut
    ? <AccountMenu email={accountEmail} onLogOut={onSignOut} />
    : undefined;

  return (
    <div className={`flex h-[100dvh] w-full flex-col overflow-hidden bg-[#F4F4F2] text-[#202020] transition-[grid-template-columns] duration-200 md:grid ${isSidebarCollapsed ? "md:grid-cols-[76px_minmax(0,1fr)]" : "md:grid-cols-[238px_minmax(0,1fr)]"}`}>
      <Sidebar
        activePage={page}
        collapsed={isSidebarCollapsed}
        practiceCount={practiceInterviews.length}
        onCollapseChange={setIsSidebarCollapsed}
        onPageChange={setPage}
        onShowGuide={() => setIsGuideOpen(true)}
      />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 pb-9 sm:px-9 md:pb-5 lg:px-10" id="top">
        {page === "interviews" ? (
          <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="interviews">
            <PageHeader
              accountControl={accountControl}
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
            <SearchField ariaLabel="Search by company name" className="mt-7 md:mt-5" placeholder="Search by company name" value={search} onChange={(value) => { setSearch(value); setInterviewPage(0); }} onClear={() => { setSearch(""); setInterviewPage(0); }} />

            <div className="mt-7 md:mt-5">
              <FolderTabs activeValue={activeInterviewType} ariaLabel="Interview folders" countLabel="interviews" panelId="interview-folder-panel" tabs={interviewTabs} onChange={(value) => { setActiveInterviewType(value); setInterviewPage(0); }} />
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
              {!isLoading && !error && interviews.length === 0 && <p className="p-5 text-sm text-stone-500">No interviews match this folder and company search.</p>}

              {!isLoading && !error && interviews.length > 0 && (
                <DataTable columns={interviewColumns} context={gridContext} rows={interviews} onRowClick={(interview) => void openInterview(interview)} pagination={{ page: interviewPage, pageSize: interviewPageSize, totalRows: interviewTotal, onPageChange: setInterviewPage, onPageSizeChange: (pageSize) => { setInterviewPageSize(pageSize); setInterviewPage(0); } }} />
              )}
            </section>
            </div>
          </section>
        ) : page === "questions" ? (
          <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="questions">
            <PageHeader accountControl={accountControl} description="Browse every saved question by the kind of conversation where it appeared." eyebrow="Reference collection" title="Question library" />

            <SearchField ariaLabel="Search the question library" className="mt-7 md:mt-5" placeholder="Search questions, companies, or roles" value={questionSearch} onChange={(value) => { setQuestionSearch(value); setQuestionPage(0); }} onClear={() => { setQuestionSearch(""); setQuestionPage(0); }} />

            <div className="mt-4 flex max-w-2xl flex-col gap-2 rounded-lg border border-[#D6D6D2] bg-white px-4 py-3 sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-3 text-sm font-bold text-[#303030]">
                <span className="shrink-0">Adding to</span>
                <select className="min-w-0 flex-1 rounded-md border border-[#D6D6D2] bg-[#FAFAF8] px-3 py-2 font-normal outline-none" value={activePracticeId ?? ""} onChange={(event) => selectPracticeInterview(Number(event.target.value) || null)}>
                  <option value="">Select a prep interview</option>
                  {practiceInterviews.map((interview) => <option key={interview.id} value={interview.id}>{interview.company} — {interview.role} ({interviewerLabel(interview.interviewer_type)})</option>)}
                </select>
              </label>
              <button className="shrink-0 text-sm font-bold text-[#C95712] hover:text-[#9A3D00]" type="button" onClick={() => setPage("practice")}>{practiceInterviews.length === 0 ? "+ Create prep interview" : "Manage prep interviews"}</button>
            </div>

            {areQuestionsLoading && <p className="mt-6 border-y border-stone-300 py-5 text-sm text-stone-500">Opening the question library...</p>}
            {questionsError && <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{questionsError}</p>}

            {!areQuestionsLoading && !questionsError && (
              <div className="mt-10 min-w-0 md:mt-5 md:flex md:min-h-0 md:flex-1 md:flex-col">
                <FolderTabs activeValue={activeQuestionType} ariaLabel="Interview type folders" countLabel="questions" panelId="question-folder-panel" tabs={questionTabs} onChange={(value) => { setActiveQuestionType(value); setQuestionPage(0); }} />

                <section className="relative z-20 flex min-h-[420px] flex-col overflow-hidden rounded-b-xl rounded-tr-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)] md:min-h-0 md:flex-1" id="question-folder-panel" role="tabpanel">
                  <header className="flex shrink-0 flex-col gap-3 border-b border-[#D6D6D2] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">Interview type folder</p>
                      <h2 className="mt-1 text-3xl font-bold text-[#202020]">{activeQuestionSection.title}</h2>
                      <p className="mt-2 text-sm text-[#686868]">{activeQuestionSection.description}</p>
                    </div>
                  </header>

                  {questions.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-[#686868]">No matching questions in this folder.</p>
                  ) : (
                    <DataTable columns={questionColumns} context={questionGridContext} pagination={{ page: questionPage, pageSize: questionPageSize, totalRows: questionTotal, onPageChange: setQuestionPage, onPageSizeChange: (pageSize) => { setQuestionPageSize(pageSize); setQuestionPage(0); } }} refreshKey={[activePracticeId, ...practiceSourceQuestionIds, ...pendingPracticeAdds].join("-")} rows={questions} />
                  )}
                </section>
              </div>
            )}
          </section>
        ) : (
          <PracticePage
            accountControl={accountControl}
            interviews={practiceInterviews}
            isLoadingQuestions={arePracticeQuestionsLoading}
            questions={practiceQuestions}
            onBrowseQuestions={(interviewId) => {
              selectPracticeInterview(interviewId);
              setPage("questions");
            }}
            onCreateInterview={createPracticeInterview}
            onDeleteInterview={deletePracticeInterview}
            onRemoveQuestion={removePracticeQuestion}
            onSaveAnswer={savePracticeAnswer}
            onSelectInterview={selectPracticeInterview}
          />
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-slate-950/35 px-5 py-12">
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

            <label className="mt-5 grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Company</RequiredLabel><input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Role</RequiredLabel><input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Interviewer type</RequiredLabel><select required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.interviewer_type} onChange={(event) => setForm({ ...form, interviewer_type: event.target.value as InterviewerType })}><option value="technical">Technical</option><option value="recruiter">Recruiter</option><option value="hiring_manager">Hiring manager</option></select></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Interview date</RequiredLabel><input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="date" value={form.interview_date} onChange={(event) => setForm({ ...form, interview_date: event.target.value })} /></label>
            <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><span>Notes <span className="font-normal text-slate-500">(optional)</span></span><textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>

            <fieldset className="mt-5 border-t border-slate-200 pt-5">
              <legend className="text-sm font-semibold text-slate-900"><RequiredLabel>Questions asked</RequiredLabel></legend>
              <p className="mt-1 text-sm text-slate-600">Write each question as closely as you remember it.</p>

              <div className="mt-3 grid gap-2.5">
                {questionRows.map((question, index) => (
                  <div className="flex gap-2" key={index}>
                    <input
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
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-not-allowed disabled:bg-[#D6D6D2] disabled:text-[#8A8A86]" disabled={isSaving || !canSaveInterview}>{isSaving ? "Saving..." : "Save interview"}</button>
            </footer>
          </form>
        </div>
      )}

      {isGuideOpen && <WelcomeModal onClose={closeGuide} />}

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
                    <button aria-label="Edit interview" className="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-[#D6D6D2] text-stone-600 hover:bg-[#FFE4D1] hover:text-[#C95712]" title="Edit interview" type="button" onClick={() => setIsEditingDetail(true)}><PenIcon /></button>
                    <button aria-label="Delete interview" className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" title="Delete interview" type="button" onClick={() => setIsDeleteModalOpen(true)}><BinIcon /></button>
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
                <label className="grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Company</RequiredLabel><input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.company} onChange={(event) => setEditForm({ ...editForm, company: event.target.value })} /></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Role</RequiredLabel><input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })} /></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Interviewer type</RequiredLabel><select required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.interviewer_type} onChange={(event) => setEditForm({ ...editForm, interviewer_type: event.target.value as InterviewerType })}><option value="technical">Technical</option><option value="recruiter">Recruiter</option><option value="hiring_manager">Hiring manager</option></select></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><RequiredLabel>Interview date</RequiredLabel><input required className="rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="date" value={editForm.interview_date} onChange={(event) => setEditForm({ ...editForm, interview_date: event.target.value })} /></label>
                <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"><span>Notes <span className="font-normal text-slate-500">(optional)</span></span><textarea className="min-h-28 rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></label>
                <fieldset className="mt-5 border-t border-[#D6D6D2] pt-5">
                  <legend className="text-sm font-semibold text-[#202020]">Questions asked</legend>
                  <p className="mt-1 text-sm text-[#686868]">Edit, remove, or add questions from this interview.</p>
                  {isDetailLoading ? (
                    <p className="mt-3 text-sm text-slate-500">Loading questions...</p>
                  ) : (
                    <div className="mt-3 grid gap-2.5">
                      {editQuestions.length === 0 && <p className="rounded-lg border border-dashed border-[#D6D6D2] px-4 py-3 text-sm text-[#686868]">No questions saved yet.</p>}
                      {editQuestions.map((question, index) => (
                        <div className="flex items-start gap-2" key={question.id ?? `new-${index}`}>
                          <span className="mt-3 w-6 shrink-0 text-right text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                          <textarea
                            aria-label={`Question ${index + 1}`}
                            className="min-h-20 min-w-0 flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]"
                            placeholder={`Question ${index + 1}`}
                            value={question.question_text}
                            onChange={(event) => setEditQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, question_text: event.target.value } : item))}
                          />
                          <button
                            aria-label={`Remove question ${index + 1}`}
                            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700"
                            title="Remove question"
                            type="button"
                            onClick={() => setEditQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          >
                            <BinIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="mt-3 text-sm font-bold text-[#C95712] hover:text-[#9A3D00]" type="button" onClick={() => setEditQuestions((current) => [...current, { id: null, question_text: "" }])}>+ Add question</button>
                </fieldset>
                <footer className="mt-6 flex justify-end gap-3">
                  <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-[#F4F4F2]" type="button" onClick={() => { setIsEditingDetail(false); setEditQuestions(selectedQuestions.map((question) => ({ id: question.id, question_text: question.question_text }))); setEditForm({ company: selectedInterview.company, role: selectedInterview.role, notes: selectedInterview.notes, interviewer_type: selectedInterview.interviewer_type, interview_date: selectedInterview.interview_date ?? "" }); }}>Cancel</button>
                  <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] hover:bg-[#C95712] hover:text-white disabled:cursor-wait disabled:opacity-70" disabled={isSaving || isDetailLoading} type="submit">{isSaving ? "Saving..." : "Save changes"}</button>
                </footer>
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
