import {
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  PaginationModule,
  RenderApiModule,
  RowStyleModule,
  TextFilterModule,
  TooltipModule,
  type ColDef,
  themeQuartz,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PaginationControls } from "./PaginationControls";

type DataTableProps<RowData extends object> = {
  columns: ColDef<RowData>[];
  rows: RowData[];
  context?: object;
  onRowClick?: (row: RowData) => void;
  renderMobileRow?: (row: RowData) => ReactNode;
  rowKey?: (row: RowData) => string | number;
  pagination?: {
    page: number;
    pageSize: number;
    totalRows: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  refreshKey?: unknown;
};

const communityModules = [ClientSideRowModelModule, ColumnAutoSizeModule, PaginationModule, RenderApiModule, RowStyleModule, TextFilterModule, TooltipModule];

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

export function DataTable<RowData extends object>({ columns, rows, context, onRowClick, pagination, refreshKey, renderMobileRow, rowKey }: DataTableProps<RowData>) {
  const gridRef = useRef<AgGridReact<RowData>>(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true });
  }, [refreshKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const showMobileCards = isMobile && renderMobileRow;

  return (
    <div className="min-h-0 flex-1">
      <AgGridProvider modules={communityModules}>
        <div className="flex min-h-[24rem] w-full flex-col overflow-hidden md:h-full md:min-h-0">
          {showMobileCards ? (
            <div className="grid gap-3 bg-[#F4F4F2] p-3">
              {rows.map((row, index) => <div key={rowKey?.(row) ?? index}>{renderMobileRow(row)}</div>)}
            </div>
          ) : <div className="min-h-0 flex-1">
            <AgGridReact<RowData>
            ref={gridRef}
            animateRows
            columnDefs={columns}
            context={context}
            defaultColDef={{ filter: !pagination, resizable: true, sortable: !pagination }}
            headerHeight={48}
            pagination={!pagination}
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
          </div>}
          {pagination && (
            <PaginationControls {...pagination} />
          )}
        </div>
      </AgGridProvider>
    </div>
  );
}
