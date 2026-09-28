export type QuestionGridContext = {
  canAddToPractice: boolean;
  isAddedToPractice: (questionId: number) => boolean;
  onAddToPractice: (questionId: number) => void;
};
