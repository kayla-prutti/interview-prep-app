alter table public.practice_interviews
add column if not exists notes text not null default '';
