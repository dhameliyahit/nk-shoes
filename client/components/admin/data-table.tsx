"use client";

import React, { useState, useMemo } from "react";
import { RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (val: string) => void;
  primaryAction?: React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchFilter,
  filterOptions,
  filterValue,
  onFilterChange,
  primaryAction,
  isLoading = false,
  emptyMessage = "No records found.",
  pageSize = 15,
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter by search query
  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchQuery.trim() && searchFilter) {
      result = result.filter((item) => searchFilter(item, searchQuery.trim().toLowerCase()));
    }
    return result;
  }, [data, searchQuery, searchFilter]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, safeCurrentPage, pageSize]);

  return (
    <div className="w-full bg-white border border-[#E5E7EB] shadow-2xs font-sans">
      {/* TOOLBAR: SEARCH & FILTERS & PRIMARY ACTION */}
      <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 min-w-[220px]">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-base pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-white border border-[#D1D5DB] text-xs text-[#111111] pl-9 pr-3 py-2 outline-none focus:border-[#111111] transition-colors rounded-none placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* STATUS / CATEGORY FILTER PILLS */}
          {filterOptions && filterOptions.length > 0 && onFilterChange && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onFilterChange(opt.value);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap rounded-none border ${
                    filterValue === opt.value
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#4B5563] border-[#D1D5DB] hover:border-black"
                  }`}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className="ml-1 opacity-70">({opt.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRIMARY ACTION BUTTON (e.g. + Add Product) */}
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
      </div>

      {/* TABLE CONTAINER */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 font-extrabold uppercase tracking-wider text-[11px] ${
                    col.className || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#6B7280]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                    <span>Loading data records...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#6B7280] font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={item._id || item.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-[#F9FAFB] transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-4 py-3.5 text-[#111111] font-medium ${
                        col.className || ""
                      }`}
                    >
                      {col.render
                        ? col.render(item)
                        : (item[col.accessorKey as keyof T] as React.ReactNode) ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER & PAGINATION */}
      <div className="p-3 sm:p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280] bg-[#FAFAFA]">
        <div>
          Showing{" "}
          <span className="font-bold text-[#111111]">
            {totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-bold text-[#111111]">
            {Math.min(safeCurrentPage * pageSize, totalItems)}
          </span>{" "}
          of <span className="font-bold text-[#111111]">{totalItems}</span> records
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 border border-[#D1D5DB] bg-white text-[#111111] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Previous Page"
          >
            <RiArrowLeftSLine className="text-base" />
          </button>
          <span className="px-2 font-bold text-[#111111]">
            {safeCurrentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 border border-[#D1D5DB] bg-white text-[#111111] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Next Page"
          >
            <RiArrowRightSLine className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
