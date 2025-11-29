import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Sparkles, BarChart3, TrendingUp, PieChart as PieIcon, Loader2 } from "lucide-react";
import { PlotlyVisualization } from "./PlotlyVisualization";
import { ApiService } from "@/services/api";
import { toast } from "sonner";

interface DataVisualizationsProps {
  data: any[];
  headers: string[];
  type: "bar" | "line" | "pie";
}

const COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(240, 73%, 65%)",
  "hsl(200, 83%, 58%)",
  "hsl(150, 73%, 55%)",
  "hsl(30, 83%, 58%)",
  "hsl(340, 73%, 65%)",
];

export const DataVisualizations = ({ data, headers, type }: DataVisualizationsProps) => {
  const [vizMode, setVizMode] = useState<'local' | 'ai'>('local');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPlotData, setAiPlotData] = useState<any>(null);
  const [showAIPlot, setShowAIPlot] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<{x?: string, y?: string}>({});

  // Trouver les colonnes numériques
  const numericColumns = headers.filter((header) => {
    const sample = data[0]?.[header];
    return !isNaN(parseFloat(sample)) && isFinite(sample);
  });

  // Préparer les données pour le graphique local
  const chartData = data.slice(0, 20).map((row, idx) => ({
    name: row[headers[0]]?.toString().substring(0, 10) || `Ligne ${idx + 1}`,
    ...numericColumns.reduce((acc, col) => {
      acc[col] = parseFloat(row[col]) || 0;
      return acc;
    }, {} as Record<string, number>),
  }));

  const generateAIVisualization = async () => {
    if (!selectedColumns.x || !selectedColumns.y) {
      toast.error("Sélection requise", {
        description: "Veuillez sélectionner les colonnes X et Y"
      });
      return;
    }

    setIsGeneratingAI(true);

    try {
      const prompt = `Crée un graphique ${type === 'bar' ? 'en barres' : type === 'line' ? 'linéaire' : 'circulaire'} montrant la relation entre "${selectedColumns.x}" (axe X) et "${selectedColumns.y}" (axe Y). Utilise les données disponibles dans la base de données.`;

      const result = await ApiService.createVisualization(prompt);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data?.visualization) {
        setAiPlotData(result.data.visualization);
        setShowAIPlot(true);

        toast.success("Visualisation IA créée", {
          description: "Graphique généré par agent spécialisé"
        });
      } else {
        throw new Error("Aucune visualisation générée");
      }

    } catch (error) {
      console.error("Erreur de visualisation IA:", error);
      toast.error("Erreur de génération", {
        description: error instanceof Error ? error.message : "Impossible de créer la visualisation IA"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (numericColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Aucune colonne numérique détectée pour la visualisation
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }} 
              />
              <Legend />
              {numericColumns.slice(0, 3).map((col, idx) => (
                <Bar 
                  key={col} 
                  dataKey={col} 
                  fill={COLORS[idx % COLORS.length]}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }} 
              />
              <Legend />
              {numericColumns.slice(0, 3).map((col, idx) => (
                <Line 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        const pieData = numericColumns.slice(0, 1).flatMap((col) => {
          const values = data.slice(0, 6).map((row, idx) => ({
            name: row[headers[0]]?.toString().substring(0, 15) || `Item ${idx + 1}`,
            value: parseFloat(row[col]) || 0,
          }));
          return values;
        });

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {type === "bar" && "📊 Histogrammes"}
              {type === "line" && "📈 Tendances temporelles"}
              {type === "pie" && "🥧 Distribution"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Choisissez le mode de génération de votre visualisation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={vizMode === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVizMode('local')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Local
            </Button>
            <Button
              variant={vizMode === 'ai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVizMode('ai')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              IA Agent
            </Button>
          </div>
        </div>
      </Card>

      {/* Local Visualization */}
      {vizMode === 'local' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Visualisation Locale</h4>
              <span className="text-xs bg-muted px-2 py-1 rounded">Auto-générée</span>
            </div>
            <div className="bg-card/50 p-4 rounded-lg">
              {renderChart()}
            </div>
          </div>
        </Card>
      )}

      {/* AI Visualization */}
      {vizMode === 'ai' && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Visualisation IA Agent</h4>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Agent Spécialisé</span>
            </div>

            {/* Column Selection for AI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Colonne X (Catégories)</label>
                <Select
                  value={selectedColumns.x || ""}
                  onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, x: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Colonne Y (Valeurs)</label>
                <Select
                  value={selectedColumns.y || ""}
                  onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, y: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={generateAIVisualization}
                disabled={isGeneratingAI || !selectedColumns.x || !selectedColumns.y}
                className="gap-2"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération IA en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer avec IA Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Plot Display */}
      {showAIPlot && aiPlotData && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-700">Visualisation IA Générée</h4>
              </div>
              <Button
                onClick={() => setShowAIPlot(false)}
                variant="outline"
                size="sm"
              >
                Fermer
              </Button>
            </div>

            <PlotlyVisualization
              plotData={aiPlotData}
              isOpen={showAIPlot}
              onClose={() => setShowAIPlot(false)}
              onRefresh={generateAIVisualization}
            />

            <div className="text-sm text-muted-foreground">
              🤖 Graphique créé par Agent IA spécialisé • Colonnes : {selectedColumns.x} × {selectedColumns.y}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
