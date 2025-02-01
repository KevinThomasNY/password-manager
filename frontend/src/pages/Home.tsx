import React, { useState, useEffect, useMemo } from "react";
import debounce from "lodash.debounce";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

import { getPasswords } from "@/api/password-api";
import { columns } from "@/components/password-columns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  // Page & Page Size
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Controlled input for search
  const [inputValue, setInputValue] = useState("");
  // The actual search value used for queries
  const [search, setSearch] = useState("");
  // Row selection state
  const [rowSelection, setRowSelection] = useState({});

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value);
        setPage(1);
      }, 500),
    [setSearch, setPage]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetSearch(value);
  };

  useEffect(() => {
    // Cleanup the debounce on unmount.
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // Fetch data from the API
  const { isLoading, error, data } = useQuery({
    queryKey: ["passwords", page, pageSize, search],
    queryFn: () => getPasswords(page, pageSize, search),
    refetchOnWindowFocus: false,
  });

  // Prepare table options using useMemo.
  // This object is memoized and then passed to the hook.
  const tableOptions = useMemo(
    () => ({
      data: data?.data ?? [],
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      manualPagination: true,
      pageCount: data ? Math.ceil(data.total / pageSize) : 0,
      state: {
        pagination: {
          pageIndex: page - 1,
          pageSize,
        },
        rowSelection,
      },
      onRowSelectionChange: setRowSelection,
      enableRowSelection: true,
    }),
    [data, page, pageSize, rowSelection]
  );

  const table = useReactTable(tableOptions);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }
  if (error instanceof Error) {
    return (
      <div className="text-red-500 text-center p-4">
        An error has occurred: {error.message}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="text-red-500 text-center p-4">No data available</div>
    );
  }

  const totalPages = Math.ceil(data.total / pageSize);
  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <form onSubmit={(e) => e.preventDefault()}>
        <Input
          type="text"
          placeholder="Search by name..."
          onChange={handleSearchChange}
          value={inputValue}
          className="max-w-sm"
        />
      </form>

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer: Selection Count, Total Items, and Pagination Controls */}
      <div className="flex items-center justify-between p-4">
        {/* Selected rows */}
        <div className="text-sm text-muted-foreground">
          {selectedRowCount} row{selectedRowCount !== 1 && "s"} selected
        </div>
        {/* Total items */}
        <div className="text-sm text-muted-foreground">
          Total {data.total} items
        </div>
        {/* Pagination Controls */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => setPage(1)}
            disabled={page === 1}
            variant="outline"
            size="sm"
            aria-label="First Page"
          >
            <ChevronFirst size={16} />
          </Button>
          <Button
            type="button"
            onClick={() => setPage((old) => Math.max(old - 1, 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            onClick={() => setPage((old) => Math.min(old + 1, totalPages))}
            disabled={page >= totalPages}
            variant="outline"
            size="sm"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            variant="outline"
            size="sm"
            aria-label="Last Page"
          >
            <ChevronLast size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
