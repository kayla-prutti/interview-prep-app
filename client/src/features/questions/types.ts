export type QuestionGridContext = {
  canAddToPractice: boolean;
  isAddedToPractice: (questionId: number) => boolean;
  isAddingToPractice: (questionId: number) => boolean;
  onAddToPractice: (questionId: number) => void;
  onChoosePractice: () => void;
};
