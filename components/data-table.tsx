"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  error?: string;
  wrapperClassName?: string;
  headClassName?: string;
  cellClassName?: string;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  showGridLines?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  error,
  wrapperClassName,
  headClassName,
  cellClassName,
  stickyHeader = false,
  stickyFirstColumn = false,
  showGridLines = false,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={cn("rounded-md border overflow-auto", wrapperClassName)} style={{maxHeight: stickyHeader ? '600px' : 'none'}}>
        <Table className={cn(showGridLines ? "border-collapse" : "")}>
          <TableHeader className={cn(stickyHeader ? "sticky top-0 z-20 bg-white" : "")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className={cn(
                        headClassName,
                        showGridLines ? "border border-gray-300" : "",
                        stickyFirstColumn && index === 0 ? "sticky left-0 z-10 bg-orange-100 border-r border-gray-300" : ""
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell 
                      key={cell.id} 
                      className={cn(
                        cellClassName,
                        showGridLines ? "border border-gray-300" : "",
                        stickyFirstColumn && index === 0 ? "sticky left-0 z-10 bg-white border-r border-gray-300" : ""
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                className={
                  !table.getCanPreviousPage()
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
            {table.getPageCount() > 0 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive={table.getState().pagination.pageIndex === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    table.setPageIndex(0);
                  }}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}
            {table.getPageCount() > 3 &&
              table.getState().pagination.pageIndex > 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            {table.getState().pagination.pageIndex > 0 &&
              table.getState().pagination.pageIndex < table.getPageCount() - 1 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={true}
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    {table.getState().pagination.pageIndex + 1}
                  </PaginationLink>
                </PaginationItem>
              )}
            {table.getPageCount() > 3 &&
              table.getState().pagination.pageIndex < table.getPageCount() - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            {table.getPageCount() > 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive={
                    table.getState().pagination.pageIndex ===
                    table.getPageCount() - 1
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    table.setPageIndex(table.getPageCount() - 1);
                  }}
                >
                  {table.getPageCount()}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={
                  !table.getCanNextPage()
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}