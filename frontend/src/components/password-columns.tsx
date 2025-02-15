import { ColumnDef } from "@tanstack/react-table";
import { Password } from "@/api/password-api";
import { Checkbox } from "@/components/ui/checkbox";
import PasswordCell from "./password-cell";
import VertaiclEllipsis from "./vertical-ellipsis-cell";

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
    accessorKey: "image",
    header: "Icon",
    cell: ({ row }) =>
      row.original.image ? (
        <img
          src={`${import.meta.env.VITE_BASE_URL}${row.original.image}`}
          alt={row.original.name}
          className="h-10 w-10 object-cover"
        />
      ) : null,
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
    id: "actions",
    cell: ({ row }) => <VertaiclEllipsis row={row.original} />,
  },
];
