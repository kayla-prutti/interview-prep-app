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
import { BinIcon, PenIcon, PracticeIcon } from "./components/Icons";
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

type PagedResult<Item> = { items: Item[]; total: number };

function App({ accountEmail, onSignOut }: AppProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(() => localStorage.getItem("i-prep-guide-seen-v1") !== "true");
  const [page, setPage] = useState<Page>("interviews");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeInterviewType, setActiveInterviewType] = useState<InterviewFilter>("all");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewTotal, setInterviewTotal] = useState(0);
  const [interviewPage, setInterviewPage] = useState(0);
  const [interviewPageSize, setInterviewPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [questionPage, setQuestionPage] = useState(0);
  const [questionPageSize, setQuestionPageSize] = useState(10);
  const [questionSearch, setQuestionSearch] = useState("");
  const [activeQuestionType, setActiveQuestionType] = useState<InterviewFilter>("all");
  const [practiceInterviews, setPracticeInterviews] = useState<PracticeInterview[]>([]);
  const [activePracticeId, setActivePracticeId] = useState<number | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceSourceQuestionIds, setPracticeSourceQuestionIds] = useState<Set<number>>(() => new Set());
  const [isPracticePickerOpen, setIsPracticePickerOpen] = useState(false);
  const [arePracticeOptionsLoaded, setArePracticeOptionsLoaded] = useState(false);
  const [isPracticeOptionsLoading, setIsPracticeOptionsLoading] = useState(false);
  const [practiceOptionsError, setPracticeOptionsError] = useState("");
  const [pendingPracticeAdds, setPendingPracticeAdds] = useState<Set<string>>(() => new Set());
  const [isPracticeListLoading, setIsPracticeListLoading] = useState(false);
  const [arePracticeQuestionsLoading, setArePracticeQuestionsLoading] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const [practiceQuestionsError, setPracticeQuestionsError] = useState("");
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
  const [isDeletingInterview, setIsDeletingInterview] = useState(false);
  const interviewRequest = useRef(0);
  const questionRequest = useRef(0);
  const interviewPageCache = useRef(new PageCache<PagedResult<Interview>>());
  const questionPageCache = useRef(new PageCache<PagedResult<Question>>());
  const practiceOptionsLoaded = useRef(false);
  const practiceSummariesLoaded = useRef(false);
  const practiceOptionsRequest = useRef<Promise<void> | null>(null);
  const practiceSummariesRequest = useRef<Promise<void> | null>(null);
  const practiceQuestionCache = useRef(new Map<number, PracticeQuestion[]>());
  const practiceQuestionRequests = useRef(new Map<number, Promise<PracticeQuestion[]>>());
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
    } catch (caughtError) {
      if (requestId !== interviewRequest.current) return;
      setError(caughtError instanceof Error ? caughtError.message : "Could not load interviews.");
    } finally {
      if (requestId === interviewRequest.current) setIsLoading(false);
    }
  }, [activeInterviewType, debouncedSearch, interviewPage, interviewPageSize]);

  const loadQuestions = useCallback(async () => {
    const requestId = ++questionRequest.current;
    const cacheKey = createPageCacheKey({ page: questionPage, pageSize: questionPageSize, search: debouncedQuestionSearch, type: `${activeQuestionType}:${activePracticeId ?? "none"}` });
    const cached = questionPageCache.current.get(cacheKey);
    if (cached) {
      setQuestions(cached.items);
      setQuestionTotal(cached.total);
      setPracticeSourceQuestionIds(new Set(cached.items.filter((question) => question.is_added_to_practice).map((question) => question.id)));
      setQuestionsError("");
      setAreQuestionsLoading(false);
      return;
    }

    setAreQuestionsLoading(true);
    setQuestionsError("");
    try {
      const parameters = new URLSearchParams({ offset: String(questionPage * questionPageSize), limit: String(questionPageSize), search: debouncedQuestionSearch, type: activeQuestionType });
      if (activePracticeId) parameters.set("practiceInterviewId", String(activePracticeId));
      const result = await questionPageCache.current.load(cacheKey, async () => {
        const response = await apiFetch(`${API_URL}/questions/page?${parameters}`);
        if (!response.ok) throw new Error("Could not load the question library.");
        return (await response.json()) as PagedResult<Question>;
      });
      if (requestId !== questionRequest.current) return;
      setQuestions(result.items);
      setQuestionTotal(result.total);
      setPracticeSourceQuestionIds(new Set(result.items.filter((question) => question.is_added_to_practice).map((question) => question.id)));
    } catch (caughtError) {
      if (requestId !== questionRequest.current) return;
      setQuestionsError(caughtError instanceof Error ? caughtError.message : "Could not load the question library.");
    } finally {
      if (requestId === questionRequest.current) setAreQuestionsLoading(false);
    }
  }, [activePracticeId, activeQuestionType, debouncedQuestionSearch, questionPage, questionPageSize]);

  const loadPracticeInterviews = useCallback(async (view: "options" | "summary" = "summary") => {
    const requestRef = view === "options" ? practiceOptionsRequest : practiceSummariesRequest;
    if (requestRef.current) return requestRef.current;
    if (view === "summary") {
      setIsPracticeListLoading(true);
      setPracticeError("");
    } else {
      setIsPracticeOptionsLoading(true);
      setPracticeOptionsError("");
    }
    const request = (async () => {
      const parameters = view === "options" ? "?view=options" : "";
      const response = await apiFetch(`${API_URL}/practice-interviews${parameters}`);
      if (!response.ok) throw new Error("Could not load prep interviews.");
      setPracticeInterviews((await response.json()) as PracticeInterview[]);
      practiceOptionsLoaded.current = true;
      setArePracticeOptionsLoaded(true);
      if (view === "summary") practiceSummariesLoaded.current = true;
    })();
    requestRef.current = request;
    try {
      await request;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not load prep interviews.";
      if (view === "summary") setPracticeError(message);
      else setPracticeOptionsError(message);
      throw caughtError;
    } finally {
      if (requestRef.current === request) requestRef.current = null;
      if (view === "summary") setIsPracticeListLoading(false);
      else setIsPracticeOptionsLoading(false);
    }
  }, []);

  const loadPracticeQuestions = useCallback(async (practiceInterviewId: number) => {
    setPracticeQuestionsError("");
    const cached = practiceQuestionCache.current.get(practiceInterviewId);
    if (cached) {
      setPracticeQuestions(cached);
      setPracticeSourceQuestionIds(new Set(cached.map((question) => question.source_question_id).filter((id): id is number => id !== null)));
      return;
    }
    setArePracticeQuestionsLoading(true);
    try {
      let request = practiceQuestionRequests.current.get(practiceInterviewId);
      if (!request) {
        request = (async () => {
          const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}/questions`);
          if (!response.ok) throw new Error("Could not load practice questions.");
          return (await response.json()) as PracticeQuestion[];
        })();
        practiceQuestionRequests.current.set(practiceInterviewId, request);
      }
      const loadedQuestions = await request;
      practiceQuestionCache.current.set(practiceInterviewId, loadedQuestions);
      setPracticeQuestions(loadedQuestions);
      setPracticeSourceQuestionIds(new Set(loadedQuestions.map((question) => question.source_question_id).filter((id): id is number => id !== null)));
    } catch (caughtError) {
      setPracticeQuestionsError(caughtError instanceof Error ? caughtError.message : "Could not load practice questions.");
    } finally {
      practiceQuestionRequests.current.delete(practiceInterviewId);
      setArePracticeQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (page !== "practice" || practiceSummariesLoaded.current) return;
    // Preparation loads question and answer totals for its cards.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPracticeInterviews().catch(() => undefined);
  }, [loadPracticeInterviews, page]);

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
    if (!selectedInterview || isDeletingInterview) return;

    setDetailError("");
    setIsDeletingInterview(true);

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
    } finally {
      setIsDeletingInterview(false);
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
    setPracticeSourceQuestionIds(new Set());
    setPracticeQuestionsError("");
    if (practiceInterviewId) void loadPracticeQuestions(practiceInterviewId);
  }

  function selectPracticeInterviewForLibrary(practiceInterviewId: number | null) {
    setIsPracticePickerOpen(false);
    setActivePracticeId(practiceInterviewId);
    setPracticeQuestions([]);
    setPracticeSourceQuestionIds(new Set());
  }

  async function togglePracticePicker() {
    if (isPracticePickerOpen) {
      setIsPracticePickerOpen(false);
      return;
    }
    setIsPracticePickerOpen(true);
    if (practiceOptionsLoaded.current) return;
    try {
      await loadPracticeInterviews("options");
    } catch {
      // The picker displays its own retryable error state.
    }
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
    setPracticeSourceQuestionIds(new Set());
  }

  async function deletePracticeInterview(practiceInterviewId: number) {
    const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Could not delete the prep interview.");
    setPracticeInterviews((current) => current.filter((interview) => interview.id !== practiceInterviewId));
    practiceQuestionCache.current.delete(practiceInterviewId);
    if (activePracticeId === practiceInterviewId) {
      setActivePracticeId(null);
      setPracticeQuestions([]);
      setPracticeSourceQuestionIds(new Set());
    }
  }

  async function savePracticeNotes(practiceInterviewId: number, notes: string) {
    const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const result = (await response.json()) as { notes: string; updated_at: string } | { error: string };
    if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "Could not save preparation notes.");
    setPracticeInterviews((current) => current.map((interview) => interview.id === practiceInterviewId
      ? { ...interview, notes: result.notes, updated_at: result.updated_at }
      : interview));
  }

  async function addQuestionToPractice(questionId: number) {
    if (!activePracticeId) return;
    const sourceQuestion = questions.find((question) => question.id === questionId);
    if (!sourceQuestion) throw new Error("Question is not available on this page.");
    const practiceInterviewId = activePracticeId;
    const pendingKey = `${practiceInterviewId}:${questionId}`;
    if (pendingPracticeAddsRef.current.has(pendingKey)) return;
    pendingPracticeAddsRef.current.add(pendingKey);
    setPendingPracticeAdds(new Set(pendingPracticeAddsRef.current));

    try {
      const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_question_id: questionId,
          question_text: sourceQuestion.question_text,
          sort_order: Math.floor(Date.now() / 1000),
        }),
      });
      const result = (await response.json()) as PracticeQuestion | { error: string };
      if (response.status !== 409 && (!response.ok || "error" in result)) throw new Error("error" in result ? result.error : "Could not add the question.");
      setPracticeSourceQuestionIds((current) => new Set(current).add(questionId));
      setQuestions((current) => current.map((question) => question.id === questionId ? { ...question, is_added_to_practice: true } : question));
      questionPageCache.current.clear();
      practiceQuestionCache.current.delete(practiceInterviewId);
      practiceSummariesLoaded.current = false;
    } finally {
      pendingPracticeAddsRef.current.delete(pendingKey);
      setPendingPracticeAdds(new Set(pendingPracticeAddsRef.current));
    }
  }

  async function addCustomQuestionToPractice(practiceInterviewId: number, questionText: string) {
    const response = await apiFetch(`${API_URL}/practice-interviews/${practiceInterviewId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_text: questionText, sort_order: Math.floor(Date.now() / 1000) }),
    });
    const result = (await response.json()) as PracticeQuestion | { error: string };
    if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "Could not add the custom question.");
    if (activePracticeId === practiceInterviewId) setPracticeQuestions((current) => [...current, result]);
    const cachedQuestions = practiceQuestionCache.current.get(practiceInterviewId);
    if (cachedQuestions) practiceQuestionCache.current.set(practiceInterviewId, [...cachedQuestions, result]);
    setPracticeInterviews((current) => current.map((interview) => interview.id === practiceInterviewId ? { ...interview, question_count: interview.question_count + 1, updated_at: new Date().toISOString() } : interview));
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
    const cachedQuestions = practiceQuestionCache.current.get(activePracticeId);
    if (cachedQuestions) practiceQuestionCache.current.set(activePracticeId, cachedQuestions.map((question) => question.id === result.id ? { ...question, ...result } : question));
    await loadPracticeInterviews();
  }

  async function removePracticeQuestion(practiceQuestionId: number) {
    if (!activePracticeId) return;
    const removedSourceId = practiceQuestions.find((question) => question.id === practiceQuestionId)?.source_question_id;
    const response = await apiFetch(`${API_URL}/practice-interviews/${activePracticeId}/questions/${practiceQuestionId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Could not remove the question from this prep interview.");
    setPracticeQuestions((current) => current.filter((question) => question.id !== practiceQuestionId));
    const cachedQuestions = practiceQuestionCache.current.get(activePracticeId);
    if (cachedQuestions) practiceQuestionCache.current.set(activePracticeId, cachedQuestions.filter((question) => question.id !== practiceQuestionId));
    questionPageCache.current.clear();
    if (removedSourceId !== null && removedSourceId !== undefined) setPracticeSourceQuestionIds((current) => new Set([...current].filter((id) => id !== removedSourceId)));
    await loadPracticeInterviews();
  }

  const questionGridContext: QuestionGridContext = {
    canAddToPractice: activePracticeId !== null,
    practiceName: practiceInterviews.find((interview) => interview.id === activePracticeId)?.company,
    isAddedToPractice: (questionId) => practiceSourceQuestionIds.has(questionId),
    isAddingToPractice: (questionId) => activePracticeId !== null && pendingPracticeAdds.has(`${activePracticeId}:${questionId}`),
    onAddToPractice: (questionId) => void addQuestionToPractice(questionId).catch((caughtError) => setQuestionsError(caughtError instanceof Error ? caughtError.message : "Could not add the question.")),
    onChoosePractice: () => void togglePracticePicker(),
  };

  const interviewTabs: FolderTab<InterviewFilter>[] = interviewSections.map((section) => ({
    value: section.type,
    label: section.title,
  }));

  const questionTabs: FolderTab<InterviewFilter>[] = questionLibrarySections.map((section) => ({
    value: section.type,
    label: section.title,
  }));

  const activePracticeInterview = practiceInterviews.find((interview) => interview.id === activePracticeId);

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
              <button className="rounded-md bg-[#F5822A] px-4 py-2.5 text-sm font-bold text-[#202020] shadow-sm hover:bg-[#C95712] hover:text-white" type="button" onClick={() => { setForm(emptyForm); setError(""); setModalPosition({ x: 0, y: 0 }); setIsModalOpen(true); }}>
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
              <FolderTabs activeValue={activeInterviewType} ariaLabel="Interview folders" panelId="interview-folder-panel" tabs={interviewTabs} onChange={(value) => { setActiveInterviewType(value); setInterviewPage(0); }} />
            </div>

            <section className="relative z-20 flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-b-xl rounded-tr-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)]" id="interview-folder-panel" role="tabpanel">
              <header className="flex shrink-0 items-center justify-between border-b border-[#D6D6D2] px-5 py-3.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C95712]">Interview folder</p>
                  <h2 className="mt-0.5 text-lg font-bold text-[#202020]">{activeInterviewSection.title} interviews</h2>
                </div>
              </header>

              {isLoading && <p className="p-5 text-sm text-stone-500">Loading interviews...</p>}
              {error && <div className="m-5 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between" role="alert"><span>{error}</span><button className="w-fit shrink-0 rounded-md border border-red-300 px-3 py-2 font-bold hover:bg-red-100 disabled:opacity-60" disabled={isLoading} type="button" onClick={() => void loadInterviews()}>{isLoading ? "Trying again..." : "Try again"}</button></div>}
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

            <div className={`relative mt-4 max-w-3xl rounded-xl border bg-white shadow-sm ${activePracticeInterview ? "border-[#F5822A]" : "border-[#D6D6D2]"}`}>
              <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${activePracticeInterview ? "bg-[#F5822A] text-[#202020]" : "bg-[#E4E4E1] text-[#686868]"}`}><PracticeIcon /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#9A3D00]">Practice destination</p>
                  <h2 className="mt-1 truncate text-base font-bold text-[#202020]">{activePracticeInterview ? activePracticeInterview.company : "Choose a prep interview"}</h2>
                  <p className="mt-0.5 text-sm text-[#686868]">
                    {activePracticeInterview
                      ? `${activePracticeInterview.role} · ${interviewerLabel(activePracticeInterview.interviewer_type)}`
                      : "Select where questions from this library should be saved."}
                  </p>
                </div>
                <button aria-expanded={isPracticePickerOpen} className={`shrink-0 cursor-pointer rounded-md px-4 py-2.5 text-sm font-bold outline-none ${activePracticeInterview ? "border border-[#F5822A] text-[#9A3D00] hover:bg-[#FFE4D1]" : "bg-[#F5822A] text-[#202020] hover:bg-[#C95712] hover:text-white"}`} type="button" onClick={() => void togglePracticePicker()}>
                  {activePracticeInterview ? "Change prep" : "Choose prep"}
                </button>
              </div>

              {isPracticePickerOpen && (
                <div className="absolute left-4 right-4 top-[calc(100%-2px)] z-40 max-h-72 overflow-y-auto rounded-lg border border-[#BDBDB8] bg-white p-1.5 shadow-xl sm:left-auto sm:w-[430px]">
                  <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#686868]">Choose a prep interview</p>
                  {isPracticeOptionsLoading && <p className="px-3 py-3 text-sm text-[#686868]">Loading prep interviews...</p>}
                  {practiceOptionsError && <div className="m-2 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert"><p>{practiceOptionsError}</p><button className="mt-2 font-bold underline underline-offset-2" type="button" onClick={() => void loadPracticeInterviews("options").catch(() => undefined)}>Try again</button></div>}
                  {arePracticeOptionsLoaded && !isPracticeOptionsLoading && !practiceOptionsError && practiceInterviews.length === 0 && <p className="px-3 py-3 text-sm text-[#686868]">No prep interviews yet. Create one in Preparation.</p>}
                  {practiceInterviews.map((interview) => (
                    <button aria-pressed={interview.id === activePracticeId} className={`block w-full cursor-pointer rounded-md px-3 py-2.5 text-left hover:bg-[#FFF0E5] ${interview.id === activePracticeId ? "bg-[#FFF0E5]" : ""}`} key={interview.id} type="button" onClick={() => selectPracticeInterviewForLibrary(interview.id)}>
                      <span className="block text-sm font-bold text-[#202020]">{interview.company}</span>
                      <span className="mt-0.5 block text-xs text-[#686868]">{interview.role} · {interviewerLabel(interview.interviewer_type)}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 border-t border-[#E4E4E1] px-4 py-3 text-xs text-[#686868] sm:flex-row sm:items-center sm:justify-between">
                <p>{activePracticeInterview ? `Question actions now show “Add to ${activePracticeInterview.company}”.` : "Choose a prep before using the question actions below."}</p>
                <button className="w-fit cursor-pointer font-bold text-[#C95712] hover:text-[#9A3D00]" type="button" onClick={() => { setIsPracticePickerOpen(false); setPage("practice"); }}>Manage prep interviews</button>
              </div>
            </div>

            {areQuestionsLoading && <p className="mt-6 border-y border-stone-300 py-5 text-sm text-stone-500">Opening the question library...</p>}
            {questionsError && <div className="mt-6 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between" role="alert"><span>{questionsError}</span><button className="w-fit shrink-0 rounded-md border border-red-300 px-3 py-2 font-bold hover:bg-red-100 disabled:opacity-60" disabled={areQuestionsLoading} type="button" onClick={() => void loadQuestions()}>{areQuestionsLoading ? "Trying again..." : "Try again"}</button></div>}

            {!areQuestionsLoading && !questionsError && (
              <div className="mt-10 min-w-0 md:mt-5 md:flex md:min-h-0 md:flex-1 md:flex-col">
                <FolderTabs activeValue={activeQuestionType} ariaLabel="Interview type folders" panelId="question-folder-panel" tabs={questionTabs} onChange={(value) => { setActiveQuestionType(value); setQuestionPage(0); }} />

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
            error={practiceError}
            interviews={practiceInterviews}
            isLoadingInterviews={isPracticeListLoading}
            isLoadingQuestions={arePracticeQuestionsLoading}
            questionsError={practiceQuestionsError}
            questions={practiceQuestions}
            onAddCustomQuestion={addCustomQuestionToPractice}
            onBrowseQuestions={(interviewId) => {
              selectPracticeInterviewForLibrary(interviewId);
              setPage("questions");
            }}
            onCreateInterview={createPracticeInterview}
            onDeleteInterview={deletePracticeInterview}
            onRemoveQuestion={removePracticeQuestion}
            onRetry={() => loadPracticeInterviews().catch(() => undefined)}
            onSaveAnswer={savePracticeAnswer}
            onSaveNotes={savePracticeNotes}
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

            {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

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
              <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={isSaving} type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
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
              <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={isDeletingInterview} type="button" onClick={() => { setIsDeleteModalOpen(false); if (!editForm) setSelectedInterview(null); }}>Cancel</button>
              <button className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60" disabled={isDeletingInterview} type="button" onClick={() => void deleteInterview()}>{isDeletingInterview ? "Deleting..." : "Delete interview"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
