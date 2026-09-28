import { useState } from "react";
import { usesSupabase } from "../supabase";

type WelcomeModalProps = {
  onClose: () => void;
};

const guideSteps = [
  {
    eyebrow: "Welcome to i-Prep",
    title: "Keep your interview preparation in one place",
    description: "i-Prep helps you save interview experiences, build a reusable question library, and prepare answers for upcoming conversations.",
    points: ["Record what happened after each interview", "Reuse real questions for future preparation", "Practice privately at your own pace"],
  },
  {
    eyebrow: "Interview archive",
    title: "Save every interview experience",
    description: "Use Interviews as your personal history of companies, roles, dates, notes, and questions you were asked.",
    points: ["Create, view, edit, and delete interview records", "Search by company name", "Filter by recruiter, hiring manager, or technical interview"],
  },
  {
    eyebrow: "Question library",
    title: "Turn past questions into a library",
    description: "Every question saved with an interview appears in the Question Library under its interview type.",
    points: ["Search questions, companies, and roles", "Browse by interview type", "Choose a preparation interview, then select “To practice”"],
  },
  {
    eyebrow: "Preparation",
    title: "Build a focused preparation set",
    description: "Create a preparation interview for a company and role, then collect only the questions you want to work on.",
    points: ["Open an accordion to see selected questions", "Add, edit, and reveal saved answers", "Remove questions or delete the preparation interview when finished"],
  },
  {
    eyebrow: "Your data",
    title: "Your privacy comes first",
    description: "This online version does not use a shared database yet. For now, your entries are saved only in this browser and do not sync to another browser or device.",
    points: ["A secure database will be added after we select a platform designed to protect user data", "Authentication and login will be introduced with the database", "Open this guide again from “How it works” in the sidebar"],
  },
];

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = usesSupabase
    ? [...guideSteps.slice(0, -1), {
        eyebrow: "Your private account",
        title: "Your workspace follows you",
        description: "Your interviews, questions, preparation sets, and answers are saved to your private account and available whenever you sign in.",
        points: ["Database access is limited to the signed-in user's records", "People using the shared link receive their own private workspace", "Open this guide again from “How it works” in the sidebar"],
      }]
    : guideSteps;
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[#202020]/55 p-4 backdrop-blur-[2px] sm:p-6">
      <section aria-label="How i-Prep works" aria-modal="true" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#D6D6D2] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.28)]" role="dialog">
        <div className="h-1.5 bg-[#E4E4E1]">
          <div className="h-full bg-[#F5822A] transition-[width] duration-300" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="px-6 pb-7 pt-6 sm:px-9 sm:pb-9 sm:pt-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C95712]">{step.eyebrow}</p>
              <h2 className="mt-2 max-w-xl text-3xl font-bold leading-tight text-[#202020] sm:text-4xl">{step.title}</h2>
            </div>
            <button aria-label="Close guide" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#D6D6D2] text-xl text-[#686868] hover:bg-[#F4F4F2] hover:text-[#202020]" title="Close guide" type="button" onClick={onClose}>×</button>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[#686868] sm:text-base">{step.description}</p>

          <ul className="mt-6 grid gap-3">
            {step.points.map((point) => (
              <li className="flex items-start gap-3 rounded-lg border border-[#E4E4E1] bg-[#FAFAF8] px-4 py-3 text-sm font-medium leading-6 text-[#303030]" key={point}>
                <span aria-hidden="true" className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#FFE4D1] text-xs font-bold text-[#9A3D00]">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <footer className="mt-7 flex items-center justify-between gap-4 border-t border-[#E4E4E1] pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A8A86]">{stepIndex + 1} of {steps.length}</p>
            <div className="flex gap-2">
              {stepIndex > 0 && <button className="rounded-md border border-[#D6D6D2] px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-[#F4F4F2]" type="button" onClick={() => setStepIndex((current) => current - 1)}>Back</button>}
              <button autoFocus className="rounded-md bg-[#F5822A] px-5 py-2.5 text-sm font-bold text-[#202020] shadow-sm hover:bg-[#C95712] hover:text-white" type="button" onClick={() => isLastStep ? onClose() : setStepIndex((current) => current + 1)}>{isLastStep ? "Start using i-Prep" : "Next"}</button>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
