import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Edit, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { Password, deletePassword } from "@/api/password-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface VerticalEllipsisProps {
  row: Password;
}

export default function VerticalEllipsis({ row }: VerticalEllipsisProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    mutate,
    isPending,
    isError,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: (id: number) => deletePassword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDelete = () => {
    mutate(row.id);
  };

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            disabled={isDeleteDialogOpen}
            className="p-0 bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-black dark:text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32 rounded-md border border-gray-200 bg-white shadow-md p-1 dark:border-gray-700 dark:bg-gray-900">
          <DropdownMenuItem
            onSelect={() => console.log("Edit clicked")}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-red-500 hover:!text-red-600 transition-colors"
          >
            <Trash className="h-4 w-4 text-red-500" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        {isPending ? (
          <div>Deleting...</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
            {isError && (
              <p className="mt-2 text-red-500 text-sm">
                {error?.message ?? "An error occurred."}
              </p>
            )}
            {isSuccess && (
              <p className="mt-2 text-green-500 text-sm">Password deleted!</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
