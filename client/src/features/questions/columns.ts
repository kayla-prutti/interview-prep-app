import type { ColDef } from "ag-grid-community";
import type { Question } from "../../types";
import { QuestionPracticeCell } from "./Cells";

export const questionColumns: ColDef<Question>[] = [
  { field: "question_text", headerName: "Question", minWidth: 360, flex: 2.5, tooltipField: "question_text" },
  { field: "company", headerName: "Company", minWidth: 190, flex: 1, valueFormatter: ({ value }) => value || "—" },
  { colId: "practice", headerName: "Action", cellRenderer: QuestionPracticeCell, filter: false, pinned: "right", resizable: false, sortable: false, width: 130 },
];
