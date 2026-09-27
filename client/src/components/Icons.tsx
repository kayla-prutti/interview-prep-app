export function EyeIcon() {
  return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
}

export function PenIcon() {
  return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="m14.5 5.5 4 4M4 20l4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

export function BinIcon() {
  return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

export function BookIcon() {
  return <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm16 0A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7"/></svg>;
}

export function ArchiveIcon() {
  return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M4 7h16v13H4V7Zm-1-4h18v4H3V3Zm6 8h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

export function QuestionIcon() {
  return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M5 4.5h11A2.5 2.5 0 0 1 18.5 7v12H7.5A2.5 2.5 0 0 0 5 21.5v-17Zm3 4h7m-7 4h7m-7 4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

export function PracticeIcon() {
  return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M8 5h8m-9 4h10m-9 4h8m-9 4h10M5 3v18m14-18v18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7"/></svg>;
}

export function AddPracticeIcon() {
  return <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v8m-4-4h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>;
}

export function AddedIcon() {
  return <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="m8.5 12 2.3 2.3 4.8-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

export function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16"><path d={collapsed ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>;
}
