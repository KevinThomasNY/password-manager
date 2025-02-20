import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { deletePasswordsBulk } from "@/api/password-api";

interface DeleteDialogProps {
  ids?: number[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteDialog({
  ids = [],
  isOpen,
  onOpenChange,
}: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (ids: number[]) => deletePasswordsBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
      onOpenChange(false);
    },
  });

  const handleDelete = () => {
    mutate(ids);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        {isPending ? (
          <div>Deleting...</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {ids.length} item{ids.length > 1 && "s"}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
