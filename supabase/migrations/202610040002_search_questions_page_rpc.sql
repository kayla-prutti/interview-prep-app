create or replace function public.search_questions_page(
  p_search text,
  p_type text,
  p_favorite_only boolean,
  p_practice_interview_id bigint,
  p_offset integer,
  p_limit integer
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with filtered as (
    select
      questions.id,
      questions.question_text,
      questions.created_at,
      questions.interview_id,
      interviews.company,
      interviews.role,
      interviews.interviewer_type,
      questions.is_favorite,
      questions.favorite_answer,
      case
        when p_practice_interview_id is null then false
        else exists (
          select 1
          from public.practice_questions
          where practice_questions.practice_interview_id = p_practice_interview_id
            and practice_questions.source_question_id = questions.id
        )
      end as is_added_to_practice
    from public.questions
    join public.interviews
      on interviews.id = questions.interview_id
      and interviews.user_id = questions.user_id
    where (p_type = 'all' or interviews.interviewer_type = p_type)
      and (not p_favorite_only or questions.is_favorite)
      and (
        btrim(p_search) = ''
        or questions.question_text ilike '%' || p_search || '%'
        or interviews.company ilike '%' || p_search || '%'
        or interviews.role ilike '%' || p_search || '%'
      )
  ),
  paged as (
    select *
    from filtered
    order by id desc
    offset greatest(p_offset, 0)
    limit least(greatest(p_limit, 1), 50)
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(paged) order by paged.id desc) from paged), '[]'::jsonb),
    'total', (select count(*) from filtered)
  );
$$;

revoke all on function public.search_questions_page(text, text, boolean, bigint, integer, integer) from public, anon;
grant execute on function public.search_questions_page(text, text, boolean, bigint, integer, integer) to authenticated;
