import { useState } from "react";
import { MoreVertical, Edit, Trash, View } from "lucide-react";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EditPassword from "./EditPassword";
import SecurityQuestions from "./SecurityQuestions";
import DeleteDialog from "./DeleteDialog";
import { Password } from "@/api/password-api";

interface VerticalEllipsisProps {
  row: Password;
}

export default function VerticalEllipsis({ row }: VerticalEllipsisProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSecurityQuestionDialogOpen, setIsSecurityQuestionDialogOpen] =
    useState(false);

  const handleEditSelect = () => {
    setTimeout(() => {
      setIsEditDialogOpen(true);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleSecurityQuestions = () => {
    setTimeout(() => {
      setIsSecurityQuestionDialogOpen(true);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleDeleteSelect = () => {
    setTimeout(() => {
      setIsDeleteDialogOpen(true);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="p-0 bg-transparent">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-black dark:text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-lg rounded-md border border-gray-200 bg-white shadow-md p-1 dark:border-gray-700 dark:bg-gray-900">
          <DropdownMenuItem
            onSelect={handleEditSelect}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 
                       dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleSecurityQuestions}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 
                       dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <View className="h-4 w-4" />
            View Security Questions
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleDeleteSelect}
            className="flex items-center gap-2 px-3 py-1 text-sm text-red-500 
                       hover:!text-red-600 transition-colors"
          >
            <Trash className="h-4 w-4 text-red-500" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        ids={[row.id]}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />

      <EditPassword
        id={row.id}
        name={row.name}
        password={row.password}
        image={row.image}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <SecurityQuestions
        id={row.id}
        name={row.name}
        isOpen={isSecurityQuestionDialogOpen}
        onOpenChange={setIsSecurityQuestionDialogOpen}
      />
    </>
  );
}
