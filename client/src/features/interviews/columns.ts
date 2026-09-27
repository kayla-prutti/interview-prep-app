import type { ColDef } from "ag-grid-community";
import { formatDate } from "../../lib/interviews";
import type { Interview } from "../../types";
import { InterviewActionsCell, InterviewTypeCell } from "./Cells";

export const interviewColumns: ColDef<Interview>[] = [
  { field: "interview_date", headerName: "Date", minWidth: 145, sort: "desc", valueFormatter: ({ data, value }) => value ? formatDate(value) : data ? formatDate(data.created_at) : "" },
  { field: "company", headerName: "Company", minWidth: 180, flex: 1 },
  { field: "role", headerName: "Role", minWidth: 220, flex: 1.35 },
  { field: "interviewer_type", headerName: "Interview type", minWidth: 170, cellRenderer: InterviewTypeCell },
  { colId: "actions", headerName: "Actions", cellRenderer: InterviewActionsCell, filter: false, pinned: "right", resizable: false, sortable: false, width: 130 },
];
