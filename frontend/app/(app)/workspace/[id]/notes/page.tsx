import { FileText } from "lucide-react";

export default function NotesIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Selecione uma nota
        </h2>
        <p className="text-muted-foreground text-sm">
          Escolha uma nota na barra lateral ou crie uma nova para começar.
        </p>
      </div>
    </div>
  );
}
