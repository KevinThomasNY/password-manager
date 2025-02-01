import { ColumnDef } from "@tanstack/react-table";
import { Password } from "@/api/password-api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import PasswordCell from "./password-cell";

export const columns: ColumnDef<Password>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "password",
    header: "Password",
    cell: ({ getValue }) => {
      const hashedPassword = getValue() as string;
      return <PasswordCell hashedPassword={hashedPassword} />;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) =>
      row.original.image ? (
        <img
          src={row.original.image}
          alt={row.original.name}
          className="h-10 w-10"
        />
      ) : null,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        className="p-0 bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
        onClick={() => console.log("hello", row.original)}
      >
        <span className="sr-only">Open menu</span>
        <MoreVertical className="h-4 w-4 text-black dark:text-white" />
      </Button>
    ),
  },
];
