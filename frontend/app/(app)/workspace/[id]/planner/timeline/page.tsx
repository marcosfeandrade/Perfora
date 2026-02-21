import { Card, CardContent } from "@/components/ui/card";

export default function TimelinePage() {
  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
      <p className="text-muted-foreground mb-6">
        Visualização em linha do tempo das tarefas e marcos.
      </p>
      <Card className="p-6 border-dashed">
        <CardContent className="p-0">
          <p className="text-muted-foreground text-sm text-center">
            A timeline será integrada aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
