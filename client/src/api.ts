import { API_URL } from "./config";
import { supabaseFetch } from "./supabaseApi";
import { usesSupabase } from "./supabase";
import type { Interview, PracticeInterview, PracticeQuestion, Question } from "./types";

type BrowserStore = {
  interviews: Interview[];
  questions: Question[];
  practiceInterviews: PracticeInterview[];
  practiceQuestions: PracticeQuestion[];
};

const storageKey = "i-prep-browser-data-v1";
const browserStorageEnabled = import.meta.env.VITE_STORAGE_MODE === "browser";
const emptyStore: BrowserStore = { interviews: [], questions: [], practiceInterviews: [], practiceQuestions: [] };

function readStore(): BrowserStore {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(emptyStore);
  try {
    return { ...structuredClone(emptyStore), ...(JSON.parse(saved) as Partial<BrowserStore>) };
  } catch {
    return structuredClone(emptyStore);
  }
}

function writeStore(store: BrowserStore) {
  localStorage.setItem(storageKey, JSON.stringify(store));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function nextId(items: { id: number }[]) {
  return items.reduce((largest, item) => Math.max(largest, item.id), 0) + 1;
}

function bodyOf(init?: RequestInit) {
  return init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
}

function practiceInterviews(store: BrowserStore) {
  return store.practiceInterviews.map((interview) => {
    const selected = store.practiceQuestions.filter((question) => question.practice_interview_id === interview.id);
    return {
      ...interview,
      question_count: selected.length,
      answered_count: selected.filter((question) => question.answer.trim() !== "").length,
    };
  }).sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id - a.id);
}

function browserFetch(url: string, init?: RequestInit): Promise<Response> {
  const requestUrl = new URL(url.startsWith(API_URL) ? url.slice(API_URL.length) : url, window.location.origin);
  const path = requestUrl.pathname;
  const query = requestUrl.searchParams;
  const method = (init?.method ?? "GET").toUpperCase();
  const store = readStore();
  const now = new Date().toISOString();

  if (path === "/interviews" && method === "GET") {
    return Promise.resolve(json([...store.interviews].sort((a, b) => (b.interview_date ?? "").localeCompare(a.interview_date ?? "") || b.id - a.id)));
  }
  if (path === "/interviews/page" && method === "GET") {
    const search = (query.get("search") ?? "").trim().toLowerCase();
    const type = query.get("type") ?? "all";
    const offset = Math.max(0, Number(query.get("offset")) || 0);
    const limit = Math.min(50, Math.max(1, Number(query.get("limit")) || 10));
    const includeCounts = query.get("includeCounts") !== "false";
    const matchingSearch = store.interviews.filter((interview) => search === "" || interview.company.toLowerCase().includes(search));
    const matchingRows = matchingSearch
      .filter((interview) => type === "all" || interview.interviewer_type === type)
      .sort((a, b) => (b.interview_date ?? "").localeCompare(a.interview_date ?? "") || b.id - a.id);
    const counts = includeCounts ? {
      all: matchingSearch.length,
      recruiter: matchingSearch.filter((item) => item.interviewer_type === "recruiter").length,
      hiring_manager: matchingSearch.filter((item) => item.interviewer_type === "hiring_manager").length,
      technical: matchingSearch.filter((item) => item.interviewer_type === "technical").length,
    } : undefined;
    return Promise.resolve(json({
      items: matchingRows.slice(offset, offset + limit),
      total: matchingRows.length,
      ...(counts ? { counts } : {}),
    }));
  }
  if (path === "/interviews" && method === "POST") {
    const input = bodyOf(init);
    const interview: Interview = {
      id: nextId(store.interviews),
      company: String(input.company ?? "").trim(),
      role: String(input.role ?? "").trim(),
      notes: String(input.notes ?? "").trim(),
      interviewer_type: input.interviewer_type as Interview["interviewer_type"],
      interview_date: String(input.interview_date ?? "") || null,
      created_at: now,
    };
    store.interviews.push(interview);
    writeStore(store);
    return Promise.resolve(json(interview, 201));
  }
  if (path === "/questions" && method === "GET") {
    const questions = [...store.questions].sort((a, b) => b.id - a.id).flatMap((question) => {
      const interview = store.interviews.find((item) => item.id === question.interview_id);
      return interview ? [{ ...question, company: interview.company, role: interview.role, interviewer_type: interview.interviewer_type }] : [];
    });
    return Promise.resolve(json(questions));
  }
  if (path === "/questions/page" && method === "GET") {
    const search = (query.get("search") ?? "").trim().toLowerCase();
    const type = query.get("type") ?? "all";
    const offset = Math.max(0, Number(query.get("offset")) || 0);
    const limit = Math.min(50, Math.max(1, Number(query.get("limit")) || 10));
    const includeCounts = query.get("includeCounts") !== "false";
    const matchingSearch = store.questions.flatMap((question) => {
      const interview = store.interviews.find((item) => item.id === question.interview_id);
      if (!interview) return [];
      const row = { ...question, company: interview.company, role: interview.role, interviewer_type: interview.interviewer_type };
      return search === "" || [row.question_text, row.company, row.role].some((value) => value.toLowerCase().includes(search)) ? [row] : [];
    });
    const matchingRows = matchingSearch.filter((question) => type === "all" || question.interviewer_type === type).sort((a, b) => b.id - a.id);
    const counts = includeCounts ? {
      all: matchingSearch.length,
      recruiter: matchingSearch.filter((item) => item.interviewer_type === "recruiter").length,
      hiring_manager: matchingSearch.filter((item) => item.interviewer_type === "hiring_manager").length,
      technical: matchingSearch.filter((item) => item.interviewer_type === "technical").length,
    } : undefined;
    return Promise.resolve(json({
      items: matchingRows.slice(offset, offset + limit),
      total: matchingRows.length,
      ...(counts ? { counts } : {}),
    }));
  }
  if (path === "/practice-interviews" && method === "GET") return Promise.resolve(json(practiceInterviews(store)));
  if (path === "/practice-interviews" && method === "POST") {
    const input = bodyOf(init);
    const interview: PracticeInterview = {
      id: nextId(store.practiceInterviews),
      company: String(input.company ?? "").trim(),
      role: String(input.role ?? "").trim(),
      interviewer_type: input.interviewer_type as PracticeInterview["interviewer_type"],
      question_count: 0,
      answered_count: 0,
      created_at: now,
      updated_at: now,
    };
    store.practiceInterviews.push(interview);
    writeStore(store);
    return Promise.resolve(json(interview, 201));
  }

  let match = path.match(/^\/interviews\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    const index = store.interviews.findIndex((item) => item.id === id);
    if (index < 0) return Promise.resolve(json({ error: "Interview not found." }, 404));
    if (method === "PUT") {
      const input = bodyOf(init);
      store.interviews[index] = {
        ...store.interviews[index],
        company: String(input.company ?? "").trim(),
        role: String(input.role ?? "").trim(),
        notes: String(input.notes ?? "").trim(),
        interviewer_type: input.interviewer_type as Interview["interviewer_type"],
        interview_date: String(input.interview_date ?? "") || null,
      };
      writeStore(store);
      return Promise.resolve(json(store.interviews[index]));
    }
    if (method === "DELETE") {
      const removedQuestionIds = new Set(store.questions.filter((question) => question.interview_id === id).map((question) => question.id));
      store.interviews.splice(index, 1);
      store.questions = store.questions.filter((question) => question.interview_id !== id);
      store.practiceQuestions = store.practiceQuestions.map((question) => removedQuestionIds.has(question.source_question_id ?? -1) ? { ...question, source_question_id: null } : question);
      writeStore(store);
      return Promise.resolve(new Response(null, { status: 204 }));
    }
  }

  match = path.match(/^\/interviews\/(\d+)\/questions$/);
  if (match) {
    const interviewId = Number(match[1]);
    if (method === "GET") return Promise.resolve(json(store.questions.filter((question) => question.interview_id === interviewId).sort((a, b) => b.id - a.id)));
    if (method === "POST") {
      const input = bodyOf(init);
      const question: Question = { id: nextId(store.questions), interview_id: interviewId, question_text: String(input.question_text ?? "").trim(), created_at: now };
      store.questions.push(question);
      writeStore(store);
      return Promise.resolve(json(question, 201));
    }
  }

  match = path.match(/^\/questions\/(\d+)$/);
  if (match) {
    const questionId = Number(match[1]);
    const index = store.questions.findIndex((question) => question.id === questionId);
    if (index < 0) return Promise.resolve(json({ error: "Question not found." }, 404));
    if (method === "PUT") {
      store.questions[index] = { ...store.questions[index], question_text: String(bodyOf(init).question_text ?? "").trim() };
      writeStore(store);
      return Promise.resolve(json(store.questions[index]));
    }
    if (method === "DELETE") {
      store.questions.splice(index, 1);
      store.practiceQuestions = store.practiceQuestions.map((question) => question.source_question_id === questionId ? { ...question, source_question_id: null } : question);
      writeStore(store);
      return Promise.resolve(new Response(null, { status: 204 }));
    }
  }

  match = path.match(/^\/practice-interviews\/(\d+)$/);
  if (match && method === "DELETE") {
    const id = Number(match[1]);
    store.practiceInterviews = store.practiceInterviews.filter((item) => item.id !== id);
    store.practiceQuestions = store.practiceQuestions.filter((question) => question.practice_interview_id !== id);
    writeStore(store);
    return Promise.resolve(new Response(null, { status: 204 }));
  }

  match = path.match(/^\/practice-interviews\/(\d+)\/questions$/);
  if (match) {
    const practiceInterviewId = Number(match[1]);
    if (method === "GET") {
      const selected = store.practiceQuestions.filter((question) => question.practice_interview_id === practiceInterviewId).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id).map((question) => {
        const source = store.questions.find((item) => item.id === question.source_question_id);
        const interview = store.interviews.find((item) => item.id === source?.interview_id);
        return { ...question, source_company: interview?.company };
      });
      return Promise.resolve(json(selected));
    }
    if (method === "POST") {
      const sourceQuestionId = Number(bodyOf(init).source_question_id);
      const source = store.questions.find((question) => question.id === sourceQuestionId);
      if (!source) return Promise.resolve(json({ error: "Question not found." }, 404));
      if (store.practiceQuestions.some((question) => question.practice_interview_id === practiceInterviewId && question.source_question_id === sourceQuestionId)) return Promise.resolve(json({ error: "Question is already in this prep interview." }, 409));
      const selected = store.practiceQuestions.filter((question) => question.practice_interview_id === practiceInterviewId);
      const question: PracticeQuestion = { id: nextId(store.practiceQuestions), practice_interview_id: practiceInterviewId, source_question_id: sourceQuestionId, question_text: source.question_text, answer: "", sort_order: selected.length, created_at: now, updated_at: now };
      store.practiceQuestions.push(question);
      const interview = store.practiceInterviews.find((item) => item.id === practiceInterviewId);
      if (interview) interview.updated_at = now;
      writeStore(store);
      return Promise.resolve(json(question, 201));
    }
  }

  match = path.match(/^\/practice-interviews\/(\d+)\/questions\/(\d+)$/);
  if (match) {
    const practiceInterviewId = Number(match[1]);
    const questionId = Number(match[2]);
    const index = store.practiceQuestions.findIndex((question) => question.id === questionId && question.practice_interview_id === practiceInterviewId);
    if (index < 0) return Promise.resolve(json({ error: "Practice question not found." }, 404));
    if (method === "PUT") {
      store.practiceQuestions[index] = { ...store.practiceQuestions[index], answer: String(bodyOf(init).answer ?? "").trim(), updated_at: now };
      const interview = store.practiceInterviews.find((item) => item.id === practiceInterviewId);
      if (interview) interview.updated_at = now;
      writeStore(store);
      return Promise.resolve(json(store.practiceQuestions[index]));
    }
    if (method === "DELETE") {
      store.practiceQuestions.splice(index, 1);
      writeStore(store);
      return Promise.resolve(new Response(null, { status: 204 }));
    }
  }

  return Promise.resolve(json({ error: "Not found." }, 404));
}

export function apiFetch(url: string, init?: RequestInit) {
  const requestUrl = new URL(url.startsWith(API_URL) ? url.slice(API_URL.length) : url, window.location.origin);
  const path = `${requestUrl.pathname}${requestUrl.search}`;
  if (usesSupabase) return supabaseFetch(path, init);
  return browserStorageEnabled ? browserFetch(url, init) : fetch(url, init);
}
