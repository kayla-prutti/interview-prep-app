export type QuestionGridContext = {
  canAddToPractice: boolean;
  practiceName?: string;
  isAddedToPractice: (questionId: number) => boolean;
  isAddingToPractice: (questionId: number) => boolean;
  onAddToPractice: (questionId: number) => void;
  onChoosePractice: () => void;
};
