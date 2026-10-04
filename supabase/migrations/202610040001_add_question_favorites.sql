alter table public.questions
add column if not exists is_favorite boolean not null default false,
add column if not exists favorite_answer text not null default '';

create index if not exists questions_user_favorite_id_idx
on public.questions(user_id, is_favorite, id desc);
