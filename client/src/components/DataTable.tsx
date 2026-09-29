import {
  AllCommunityModule,
  type ColDef,
  themeQuartz,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { useEffect, useRef } from "react";

type DataTableProps<RowData extends object> = {
  columns: ColDef<RowData>[];
  rows: RowData[];
  context?: object;
  onRowClick?: (row: RowData) => void;
  refreshKey?: unknown;
};

const communityModules = [AllCommunityModule];

const appGridTheme = themeQuartz.withParams({
  accentColor: "#F5822A",
  backgroundColor: "#FFFFFF",
  borderColor: "#D6D6D2",
  foregroundColor: "#202020",
  headerBackgroundColor: "#ECECEA",
  headerTextColor: "#303030",
  oddRowBackgroundColor: "#F8F8F6",
  rowHoverColor: "#FFF0E5",
  fontFamily: "inherit",
  fontSize: 14,
  borderRadius: 6,
  wrapperBorderRadius: 6,
});

export function DataTable<RowData extends object>({ columns, rows, context, onRowClick, refreshKey }: DataTableProps<RowData>) {
  const gridRef = useRef<AgGridReact<RowData>>(null);

  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true });
  }, [refreshKey]);

  return (
    <div className="min-h-0 flex-1">
      <AgGridProvider modules={communityModules}>
        <div className="h-[560px] w-full overflow-hidden md:h-full">
          <AgGridReact<RowData>
            ref={gridRef}
            animateRows
            columnDefs={columns}
            context={context}
            defaultColDef={{ filter: true, resizable: true, sortable: true }}
            headerHeight={48}
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50]}
            rowData={rows}
            rowClass={onRowClick ? "cursor-pointer" : undefined}
            rowHeight={56}
            theme={appGridTheme}
            onRowClicked={(event) => {
              const target = event.event?.target;
              if (!event.data || (target instanceof Element && target.closest("button"))) return;
              onRowClick?.(event.data);
            }}
          />
        </div>
      </AgGridProvider>
    </div>
  );
}
