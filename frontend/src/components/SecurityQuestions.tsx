import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getSecurityQuestions } from "@/api/password-api";
import { CircleX } from "lucide-react";

interface EditPasswordProps {
  id: number;
  name: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SecurityQuestions = ({
  id,
  name,
  isOpen,
  onOpenChange,
}: EditPasswordProps) => {
  const { data: questionsData, isPending, error } = useQuery({
    queryKey: ["passwordQuestions", id],
    queryFn: () => getSecurityQuestions(id),
    enabled: isOpen,
  });

  const headerTitle =
    questionsData && questionsData.length > 0
      ? `Security Questions for ${name}`
      : `No Security Questions for ${name}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto flex flex-col">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-left">{headerTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex-1">
          {isPending ? (
            <p>Loading security questions...</p>
          ) : error ? (
            <p className="text-red-500">Error loading security questions</p>
          ) : questionsData && questionsData.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {questionsData.map(
                (item: { question: string; answer: string }, index: number) => (
                  <li key={index} className="border p-3 rounded">
                    <p>
                      <strong>Question {index + 1}:</strong> {item.question}
                    </p>
                    <p>
                      <strong>Answer:</strong> {item.answer}
                    </p>
                  </li>
                )
              )}
            </ul>
          ) : null}
        </div>

        <div className="mt-4">
          <Button
            className="w-full flex items-center justify-center"
            onClick={() => onOpenChange(false)}
          >
            <CircleX size={16} className="mr-2" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityQuestions;
