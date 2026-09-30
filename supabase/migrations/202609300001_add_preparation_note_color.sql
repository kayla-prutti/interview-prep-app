alter table public.preparation_notes
add column color text not null default 'yellow'
check (color in ('yellow', 'pink', 'blue', 'green', 'orange'));
