import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps {
  data: any[];
  headers: string[];
}

export const DataTable = ({ data, headers }: DataTableProps) => {
  const displayData = data.slice(0, 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Aperçu des données</h3>
        <span className="text-sm text-muted-foreground">
          Affichage de {displayData.length} sur {data.length} lignes
        </span>
      </div>
      
      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                {headers.map((header) => (
                  <TableCell key={`${idx}-${header}`}>
                    {row[header]?.toString() || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
