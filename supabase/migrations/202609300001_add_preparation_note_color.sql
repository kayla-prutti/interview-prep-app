alter table public.preparation_notes
add column color text;

update public.preparation_notes
set color = case (id % 5)
  when 0 then 'yellow'
  when 1 then 'pink'
  when 2 then 'blue'
  when 3 then 'green'
  else 'orange'
end;

alter table public.preparation_notes
alter column color set default 'yellow',
alter column color set not null;

alter table public.preparation_notes
add constraint preparation_notes_color_check
check (color in ('yellow', 'pink', 'blue', 'green', 'orange'));
