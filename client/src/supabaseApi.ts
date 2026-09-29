import { supabase } from "./supabase";
import type { InterviewFilter, InterviewerType, Question } from "./types";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function bodyOf(init?: RequestInit) {
  return init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
}

function failure(message: string, status = 400) {
  return json({ error: message }, status);
}

function errorStatus(code?: string) {
  if (code === "23505") return 409;
  if (code === "PGRST116") return 404;
  return 400;
}

export async function supabaseFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!supabase) return failure("Cloud storage is not configured.", 503);
  const method = (init?.method ?? "GET").toUpperCase();
  const requestUrl = new URL(path, window.location.origin);
  const routePath = requestUrl.pathname;
  const query = requestUrl.searchParams;

  if (routePath === "/interviews/page" && method === "GET") {
    const search = (query.get("search") ?? "").trim();
    const requestedType = query.get("type") ?? "all";
    const type: InterviewFilter = ["recruiter", "hiring_manager", "technical"].includes(requestedType) ? requestedType as InterviewerType : "all";
    const offset = Math.max(0, Number(query.get("offset")) || 0);
    const limit = Math.min(50, Math.max(1, Number(query.get("limit")) || 10));
    let pageQuery = supabase.from("interviews").select("id, company, role, notes, interviewer_type, interview_date, created_at", { count: "exact" });
    if (search) pageQuery = pageQuery.ilike("company", `%${search}%`);
    if (type !== "all") pageQuery = pageQuery.eq("interviewer_type", type);

    try {
      const pageResult = await pageQuery.order("interview_date", { ascending: false }).order("id", { ascending: false }).range(offset, offset + limit - 1);
      if (pageResult.error) return failure(pageResult.error.message, errorStatus(pageResult.error.code));
      return json({ items: pageResult.data ?? [], total: pageResult.count ?? 0 });
    } catch (caughtError) {
      return failure(caughtError instanceof Error ? caughtError.message : "Could not load interviews.");
    }
  }

  if (routePath === "/questions/page" && method === "GET") {
    const search = (query.get("search") ?? "").trim();
    const relationSearch = search.replace(/[,%()]/g, " ").trim();
    const requestedType = query.get("type") ?? "all";
    const type: InterviewFilter = ["recruiter", "hiring_manager", "technical"].includes(requestedType) ? requestedType as InterviewerType : "all";
    const offset = Math.max(0, Number(query.get("offset")) || 0);
    const limit = Math.min(50, Math.max(1, Number(query.get("limit")) || 10));
    let matchingQuestionIds: number[] | null = null;

    if (search) {
      const [textMatches, interviewMatches] = await Promise.all([
        supabase.from("questions").select("id").ilike("question_text", `%${search}%`),
        relationSearch
          ? supabase.from("interviews").select("id").or(`company.ilike.%${relationSearch}%,role.ilike.%${relationSearch}%`)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (textMatches.error) return failure(textMatches.error.message, errorStatus(textMatches.error.code));
      if (interviewMatches.error) return failure(interviewMatches.error.message, errorStatus(interviewMatches.error.code));
      const interviewIds = (interviewMatches.data ?? []).map((item) => item.id);
      const relatedMatches = interviewIds.length > 0
        ? await supabase.from("questions").select("id").in("interview_id", interviewIds)
        : { data: [], error: null };
      if (relatedMatches.error) return failure(relatedMatches.error.message, errorStatus(relatedMatches.error.code));
      matchingQuestionIds = [...new Set([...(textMatches.data ?? []).map((item) => item.id), ...(relatedMatches.data ?? []).map((item) => item.id)])];
      if (matchingQuestionIds.length === 0) return json({ items: [], total: 0 });
    }

    let pageQuery = supabase.from("questions").select("id, question_text, created_at, interview_id, interviews!inner(company, role, interviewer_type)", { count: "exact" });
    if (matchingQuestionIds) pageQuery = pageQuery.in("id", matchingQuestionIds);
    if (type !== "all") pageQuery = pageQuery.eq("interviews.interviewer_type", type);

    try {
      const pageResult = await pageQuery.order("id", { ascending: false }).range(offset, offset + limit - 1);
      if (pageResult.error) return failure(pageResult.error.message, errorStatus(pageResult.error.code));
      const items = (pageResult.data ?? []).map((row) => {
        const interview = row.interviews as unknown as { company: string; role: string; interviewer_type: Question["interviewer_type"] };
        return { id: row.id, question_text: row.question_text, created_at: row.created_at, interview_id: row.interview_id, company: interview.company, role: interview.role, interviewer_type: interview.interviewer_type };
      });
      return json({ items, total: pageResult.count ?? 0 });
    } catch (caughtError) {
      return failure(caughtError instanceof Error ? caughtError.message : "Could not load questions.");
    }
  }

  if (routePath === "/interviews" && method === "GET") {
    const { data, error } = await supabase.from("interviews").select("id, company, role, notes, interviewer_type, interview_date, created_at").order("interview_date", { ascending: false }).order("id", { ascending: false });
    return error ? failure(error.message, errorStatus(error.code)) : json(data);
  }
  if (routePath === "/interviews" && method === "POST") {
    const input = bodyOf(init);
    const { data, error } = await supabase.from("interviews").insert({ company: input.company, role: input.role, notes: input.notes, interviewer_type: input.interviewer_type, interview_date: input.interview_date }).select("id, company, role, notes, interviewer_type, interview_date, created_at").single();
    return error ? failure(error.message, errorStatus(error.code)) : json(data, 201);
  }
  if (routePath === "/questions" && method === "GET") {
    const { data, error } = await supabase.from("questions").select("id, question_text, created_at, interview_id, interviews!inner(company, role, interviewer_type)").order("id", { ascending: false });
    if (error) return failure(error.message, errorStatus(error.code));
    const questions = (data ?? []).map((row) => {
      const interview = row.interviews as unknown as { company: string; role: string; interviewer_type: Question["interviewer_type"] };
      return { id: row.id, question_text: row.question_text, created_at: row.created_at, interview_id: row.interview_id, company: interview.company, role: interview.role, interviewer_type: interview.interviewer_type };
    });
    return json(questions);
  }
  if (routePath === "/practice-interviews" && method === "GET") {
    const [{ data, error }, selectedResult] = await Promise.all([
      supabase.from("practice_interviews").select("id, company, role, interviewer_type, created_at, updated_at").order("updated_at", { ascending: false }).order("id", { ascending: false }),
      supabase.from("practice_questions").select("id, practice_interview_id, answer"),
    ]);
    if (error) return failure(error.message, errorStatus(error.code));
    if (selectedResult.error) return failure(selectedResult.error.message, errorStatus(selectedResult.error.code));
    const interviews = (data ?? []).map((interview) => {
      const selected = (selectedResult.data ?? []).filter((question) => question.practice_interview_id === interview.id);
      return { ...interview, question_count: selected.length, answered_count: selected.filter((question) => question.answer.trim() !== "").length };
    });
    return json(interviews);
  }
  if (routePath === "/practice-interviews" && method === "POST") {
    const input = bodyOf(init);
    const { data, error } = await supabase.from("practice_interviews").insert({ company: input.company, role: input.role, interviewer_type: input.interviewer_type }).select("id, company, role, interviewer_type, created_at, updated_at").single();
    return error ? failure(error.message, errorStatus(error.code)) : json({ ...data, question_count: 0, answered_count: 0 }, 201);
  }

  let match = routePath.match(/^\/interviews\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    if (method === "PUT") {
      const input = bodyOf(init);
      const { data, error } = await supabase.from("interviews").update({ company: input.company, role: input.role, notes: input.notes, interviewer_type: input.interviewer_type, interview_date: input.interview_date }).eq("id", id).select("id, company, role, notes, interviewer_type, interview_date, created_at").single();
      return error ? failure(error.message, errorStatus(error.code)) : json(data);
    }
    if (method === "DELETE") {
      const { error } = await supabase.from("interviews").delete().eq("id", id);
      return error ? failure(error.message, errorStatus(error.code)) : new Response(null, { status: 204 });
    }
  }

  match = routePath.match(/^\/interviews\/(\d+)\/questions$/);
  if (match) {
    const interviewId = Number(match[1]);
    if (method === "GET") {
      const { data, error } = await supabase.from("questions").select("id, interview_id, question_text, created_at").eq("interview_id", interviewId).order("id", { ascending: false });
      return error ? failure(error.message, errorStatus(error.code)) : json(data);
    }
    if (method === "POST") {
      const { data, error } = await supabase.from("questions").insert({ interview_id: interviewId, question_text: bodyOf(init).question_text }).select("id, interview_id, question_text, created_at").single();
      return error ? failure(error.message, errorStatus(error.code)) : json(data, 201);
    }
  }

  match = routePath.match(/^\/questions\/(\d+)$/);
  if (match) {
    const questionId = Number(match[1]);
    if (method === "PUT") {
      const { data, error } = await supabase.from("questions").update({ question_text: bodyOf(init).question_text }).eq("id", questionId).select("id, interview_id, question_text, created_at").single();
      return error ? failure(error.message, errorStatus(error.code)) : json(data);
    }
    if (method === "DELETE") {
      const { error } = await supabase.from("questions").delete().eq("id", questionId);
      return error ? failure(error.message, errorStatus(error.code)) : new Response(null, { status: 204 });
    }
  }

  match = routePath.match(/^\/practice-interviews\/(\d+)$/);
  if (match && method === "DELETE") {
    const { error } = await supabase.from("practice_interviews").delete().eq("id", Number(match[1]));
    return error ? failure(error.message, errorStatus(error.code)) : new Response(null, { status: 204 });
  }

  match = routePath.match(/^\/practice-interviews\/(\d+)\/questions$/);
  if (match) {
    const practiceInterviewId = Number(match[1]);
    if (method === "GET") {
      const { data, error } = await supabase
        .from("practice_questions")
        .select("id, practice_interview_id, source_question_id, question_text, answer, sort_order, created_at, updated_at, source_question:questions(interviews(company))")
        .eq("practice_interview_id", practiceInterviewId)
        .order("sort_order")
        .order("id");
      if (error) return failure(error.message, errorStatus(error.code));
      return json((data ?? []).map((question) => {
        const source = question.source_question as unknown as { interviews: { company: string } | null } | null;
        const { source_question: _sourceQuestion, ...practiceQuestion } = question;
        return { ...practiceQuestion, source_company: source?.interviews?.company };
      }));
    }
    if (method === "POST") {
      const sourceQuestionId = Number(bodyOf(init).source_question_id);
      const sourceResult = await supabase.from("questions").select("id, question_text").eq("id", sourceQuestionId).single();
      if (sourceResult.error) return failure(sourceResult.error.message, errorStatus(sourceResult.error.code));
      const orderResult = await supabase.from("practice_questions").select("sort_order").eq("practice_interview_id", practiceInterviewId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
      if (orderResult.error) return failure(orderResult.error.message, errorStatus(orderResult.error.code));
      const { data, error } = await supabase.from("practice_questions").insert({ practice_interview_id: practiceInterviewId, source_question_id: sourceQuestionId, question_text: sourceResult.data.question_text, sort_order: (orderResult.data?.sort_order ?? -1) + 1 }).select("id, practice_interview_id, source_question_id, question_text, answer, sort_order, created_at, updated_at").single();
      if (error?.code === "23505") return failure("Question is already in this prep interview.", 409);
      return error ? failure(error.message, errorStatus(error.code)) : json(data, 201);
    }
  }

  match = routePath.match(/^\/practice-interviews\/(\d+)\/questions\/(\d+)$/);
  if (match) {
    const practiceInterviewId = Number(match[1]);
    const questionId = Number(match[2]);
    if (method === "PUT") {
      const { data, error } = await supabase.from("practice_questions").update({ answer: bodyOf(init).answer }).eq("id", questionId).eq("practice_interview_id", practiceInterviewId).select("id, practice_interview_id, source_question_id, question_text, answer, sort_order, created_at, updated_at").single();
      return error ? failure(error.message, errorStatus(error.code)) : json(data);
    }
    if (method === "DELETE") {
      const { error } = await supabase.from("practice_questions").delete().eq("id", questionId).eq("practice_interview_id", practiceInterviewId);
      return error ? failure(error.message, errorStatus(error.code)) : new Response(null, { status: 204 });
    }
  }

  return failure("Not found.", 404);
}
