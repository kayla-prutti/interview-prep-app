import type { Question } from "../../types";

export type QuestionGridContext = {
  canAddToPractice: boolean;
  practiceName?: string;
  isAddedToPractice: (questionId: number) => boolean;
  isAddingToPractice: (questionId: number) => boolean;
  isUpdatingFavorite: (questionId: number) => boolean;
  onAddToPractice: (questionId: number) => void;
  onChoosePractice: () => void;
  onToggleFavorite: (question: Question) => void;
};
