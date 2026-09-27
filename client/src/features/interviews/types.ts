import type { Interview } from "../../types";

export type InterviewGridContext = {
  onView: (interview: Interview) => void;
  onEdit: (interview: Interview) => void;
  onDelete: (interview: Interview) => void;
};
