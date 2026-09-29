drop policy if exists "users insert own prep questions" on public.practice_questions;

create policy "users insert own prep questions"
on public.practice_questions
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and (
    source_question_id is null
    or exists (
      select 1
      from public.questions
      where questions.id = practice_questions.source_question_id
        and questions.user_id = (select auth.uid())
    )
  )
);
