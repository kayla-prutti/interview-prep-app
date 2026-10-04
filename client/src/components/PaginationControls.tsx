type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function PaginationControls({ page, pageSize, totalRows, onPageChange, onPageSizeChange }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const firstRow = totalRows > 0 ? page * pageSize + 1 : 0;
  const lastRow = Math.min((page + 1) * pageSize, totalRows);

  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#D6D6D2] bg-white px-3 py-3 text-xs text-[#4A4A4A] sm:text-sm md:h-14 md:flex-nowrap md:justify-end md:gap-5 md:px-5 md:py-0">
      <label className="flex items-center gap-2"><span className="hidden sm:inline">Page size</span><select aria-label="Page size" className="rounded-md border border-[#D6D6D2] bg-white px-2 py-1.5" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label>
      <span className="whitespace-nowrap">{firstRow}–{lastRow} of {totalRows}</span>
      <div className="flex items-center gap-1.5">
        <button aria-label="Previous page" className="grid h-10 w-10 place-items-center rounded-md border border-[#D6D6D2] text-lg disabled:opacity-35 md:h-8 md:w-8" disabled={page === 0} type="button" onClick={() => onPageChange(page - 1)}>‹</button>
        <span className="min-w-16 whitespace-nowrap text-center md:min-w-20">{page + 1} of {totalPages}</span>
        <button aria-label="Next page" className="grid h-10 w-10 place-items-center rounded-md border border-[#D6D6D2] text-lg disabled:opacity-35 md:h-8 md:w-8" disabled={page + 1 >= totalPages} type="button" onClick={() => onPageChange(page + 1)}>›</button>
      </div>
    </footer>
  );
}
