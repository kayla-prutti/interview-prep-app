create extension if not exists pg_trgm;

create index if not exists interviews_user_date_idx
on public.interviews(user_id, interview_date desc, id desc);

create index if not exists interviews_user_type_idx
on public.interviews(user_id, interviewer_type);

create index if not exists interviews_company_search_idx
on public.interviews using gin (company gin_trgm_ops);

create index if not exists interviews_role_search_idx
on public.interviews using gin (role gin_trgm_ops);

create index if not exists questions_user_id_desc_idx
on public.questions(user_id, id desc);

create index if not exists questions_user_interview_idx
on public.questions(user_id, interview_id);

create index if not exists questions_text_search_idx
on public.questions using gin (question_text gin_trgm_ops);
