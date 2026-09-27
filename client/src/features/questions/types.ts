export type QuestionGridContext = {
  isAddedToPractice: (questionId: number) => boolean;
  onTogglePractice: (questionId: number) => void;
};
