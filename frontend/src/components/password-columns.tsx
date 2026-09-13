import { ColumnDef } from "@tanstack/react-table";
import { Password } from "@/api/password-api";
import { Checkbox } from "@/components/ui/checkbox";
import PasswordCell from "./password-cell";
import VertaiclEllipsis from "./vertical-ellipsis-cell";
import moment from "moment-timezone";
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
          src={`${import.meta.env.VITE_API_BASE_URL || "/api"}/passwords/${row.original.id}/image`}
          alt={row.original.name}
          className="h-10 w-10 object-cover rounded-md"
        />
      ) : null,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "password",
    header: "Password",
    cell: ({ row }) => <PasswordCell passwordId={row.original.id} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ getValue }) => {
      const timestamp = getValue() as string;
      return moment
        .utc(timestamp)
        .tz("America/New_York")
        .format("MMM DD, YYYY h:mm A");
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ getValue }) => {
      const timestamp = getValue() as string;
      return moment
        .utc(timestamp)
        .tz("America/New_York")
        .format("MMM DD, YYYY h:mm A");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <VertaiclEllipsis row={row.original} />,
  },
];
