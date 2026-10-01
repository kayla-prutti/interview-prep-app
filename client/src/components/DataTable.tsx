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
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.totalRows / pagination.pageSize)) : 1;
  const firstRow = pagination && pagination.totalRows > 0 ? pagination.page * pagination.pageSize + 1 : 0;
  const lastRow = pagination ? Math.min((pagination.page + 1) * pagination.pageSize, pagination.totalRows) : 0;

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
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#D6D6D2] bg-white px-3 py-3 text-xs text-[#4A4A4A] sm:text-sm md:h-14 md:flex-nowrap md:justify-end md:gap-5 md:px-5 md:py-0">
              <label className="flex items-center gap-2"><span className="hidden sm:inline">Page size</span><select aria-label="Page size" className="rounded-md border border-[#D6D6D2] bg-white px-2 py-1.5" value={pagination.pageSize} onChange={(event) => pagination.onPageSizeChange(Number(event.target.value))}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label>
              <span className="whitespace-nowrap">{firstRow}–{lastRow} of {pagination.totalRows}</span>
              <div className="flex items-center gap-1.5">
                <button aria-label="Previous page" className="grid h-10 w-10 place-items-center rounded-md border border-[#D6D6D2] text-lg disabled:opacity-35 md:h-8 md:w-8" disabled={pagination.page === 0} type="button" onClick={() => pagination.onPageChange(pagination.page - 1)}>‹</button>
                <span className="min-w-16 whitespace-nowrap text-center md:min-w-20">{pagination.page + 1} of {totalPages}</span>
                <button aria-label="Next page" className="grid h-10 w-10 place-items-center rounded-md border border-[#D6D6D2] text-lg disabled:opacity-35 md:h-8 md:w-8" disabled={pagination.page + 1 >= totalPages} type="button" onClick={() => pagination.onPageChange(pagination.page + 1)}>›</button>
              </div>
            </footer>
          )}
        </div>
      </AgGridProvider>
    </div>
  );
}
