import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Sparkles, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { ApiService } from "@/services/api";
import { toast } from "sonner";

interface ReportGeneratorProps {
  data: any[];
  headers: string[];
}

export const ReportGenerator = ({ data, headers }: ReportGeneratorProps) => {
  const [reportQuery, setReportQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'analysis' | 'summary' | 'insights'>('analysis');

  const reportTemplates = {
    analysis: {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Analyse Complète",
      description: "Rapport détaillé avec analyse statistique",
      placeholder: "Ex: 'Analyse les ventes par région et identifie les tendances'"
    },
    summary: {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Résumé Exécutif",
      description: "Synthèse des points clés et métriques importantes",
      placeholder: "Ex: 'Fais un résumé des performances financières du dernier trimestre'"
    },
    insights: {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Insights & Recommandations",
      description: "Découvertes clés et suggestions d'actions",
      placeholder: "Ex: 'Quelles sont les opportunités d'amélioration identifiées dans les données ?'"
    }
  };

  const generateReport = async () => {
    if (!reportQuery.trim()) {
      toast.error("Erreur", { description: "Veuillez saisir une demande de rapport" });
      return;
    }

    setIsGenerating(true);
    setGeneratedReport(null);

    try {
      const result = await ApiService.analyzeData(reportQuery);

      if (result.error) {
        throw new Error(result.error);
      }

      const report = result.data?.analysis || "Aucun rapport généré";
      setGeneratedReport(report);

      toast.success("Rapport généré", {
        description: "L'analyse IA est terminée"
      });

    } catch (error) {
      console.error("Erreur de génération:", error);
      toast.error("Erreur de génération", {
        description: error instanceof Error ? error.message : "Impossible de générer le rapport"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;

    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-analyse-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Téléchargement", { description: "Rapport téléchargé avec succès" });
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(reportTemplates).map(([key, template]) => (
          <Card
            key={key}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              reportType === key ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => setReportType(key as typeof reportType)}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${reportType === key ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{template.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Generation Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Générateur de Rapports IA</h3>
            <Badge variant="secondary" className="ml-auto">
              Agent Spécialisé
            </Badge>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              Décrivez le rapport souhaité :
            </label>
            <Textarea
              value={reportQuery}
              onChange={(e) => setReportQuery(e.target.value)}
              placeholder={reportTemplates[reportType].placeholder}
              className="min-h-[100px] resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              💡 L'IA utilisera des agents spécialisés : SQL Developer → Data Analyst → Report Writer
            </div>
            <Button
              onClick={generateReport}
              disabled={!reportQuery.trim() || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer le Rapport
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Generated Report Display */}
      {generatedReport && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-700">Rapport Généré</h3>
              </div>
              <Button
                onClick={downloadReport}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {generatedReport}
              </pre>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Rapport généré par IA avec analyse spécialisée des données
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};