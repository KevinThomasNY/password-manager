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
import AddPassword from "./AddPassword";
import DeleteDialog from "./DeleteDialog";
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
  Download,
} from "lucide-react";

const PasswordTable = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleExportJSON = () => {
    window.location.href = `${
      import.meta.env.VITE_API_BASE_URL
    }/passwords/export/json`;
  };

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const { isLoading, error, data } = useQuery({
    queryKey: ["passwords", page, pageSize, search],
    queryFn: () => getPasswords(page, pageSize, search),
    refetchOnWindowFocus: false,
  });

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

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);
  const isDeleteDisabled = selectedIds.length === 0;

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Form with search input and action buttons */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="
    w-full 
    flex flex-wrap       /* allow wrapping */
    flex-col sm:flex-row /* stack on mobile, row on sm+ */
    items-stretch sm:items-center 
    gap-2                /* space all around */
  "
      >
        <Input
          type="text"
          placeholder="Search by name..."
          onChange={handleSearchChange}
          value={inputValue}
          className="w-full sm:max-w-sm"
        />

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button
            type="button"
            onClick={handleExportJSON}
            variant="outline"
            disabled={!data || data.data.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1"
          >
            <Download size={16} />
            Export
          </Button>
          <Button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleteDisabled}
            variant="destructive"
            className="flex-1 sm:flex-none"
          >
            Delete
          </Button>
          <AddPassword />
        </div>
      </form>

      {error instanceof Error && (
        <div className="text-red-500 text-center p-4">
          An error has occurred: {error.message}
        </div>
      )}

      <div className="relative rounded-md border min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70 z-10">
            Loading...
          </div>
        )}

        {data && (
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!isLoading && data && data.data.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            No data available
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4">
        <div className="text-sm text-muted-foreground">
          {Object.keys(rowSelection).length} row
          {Object.keys(rowSelection).length !== 1 && "s"} selected
        </div>
        <div className="text-sm text-muted-foreground">
          Total {data ? data.total : 0} items
        </div>
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
            Page {page} of {data ? Math.ceil(data.total / pageSize) : 1}
          </span>
          <Button
            type="button"
            onClick={() =>
              setPage((old) =>
                data ? Math.min(old + 1, Math.ceil(data.total / pageSize)) : old
              )
            }
            disabled={data ? page >= Math.ceil(data.total / pageSize) : true}
            variant="outline"
            size="sm"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            type="button"
            onClick={() => data && setPage(Math.ceil(data.total / pageSize))}
            disabled={data ? page >= Math.ceil(data.total / pageSize) : true}
            variant="outline"
            size="sm"
            aria-label="Last Page"
          >
            <ChevronLast size={16} />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        ids={selectedIds}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default PasswordTable;
