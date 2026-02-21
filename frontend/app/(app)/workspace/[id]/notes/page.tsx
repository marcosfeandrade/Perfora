import { Card, CardContent } from "@/components/ui/card";

export default function NotesPage() {
  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Notes</h2>
      <p className="text-muted-foreground mb-6">
        Notas e documentação do workspace.
      </p>
      <Card className="p-6 border-dashed">
        <CardContent>
          <p className="text-muted-foreground text-sm text-center">
            Área de notas em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
