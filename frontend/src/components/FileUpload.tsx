import { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle2, Cloud, CloudOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Papa from "papaparse";
import { toast } from "sonner";
import { ApiService } from "@/services/api";

interface FileUploadProps {
  onDataLoaded: (data: any[], headers: string[]) => void;
}

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Format invalide", {
        description: "Veuillez télécharger un fichier CSV",
      });
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Erreur de lecture", {
            description: "Le fichier CSV contient des erreurs",
          });
          setIsLoading(false);
          return;
        }

        const headers = results.meta.fields || [];

        // Upload to backend asynchronously
        setBackendStatus('uploading');
        ApiService.uploadFile(file).then((uploadResult) => {
          if (uploadResult.error) {
            setBackendStatus('error');
            toast.error("Erreur d'upload", {
              description: "Le dataset est affiché localement mais l'IA n'y a pas accès",
            });
          } else {
            setBackendStatus('success');
            toast.success("Dataset chargé avec succès", {
              description: `${results.data.length} lignes • ${headers.length} colonnes • Prêt pour l'analyse IA`,
            });
          }
        });

        onDataLoaded(results.data, headers);
        setIsLoading(false);
      },
      error: (error) => {
        toast.error("Erreur", {
          description: error.message,
        });
        setIsLoading(false);
      },
    });
  }, [onDataLoaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in">
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Analyse IA de Données
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explorez vos données avec l'intelligence artificielle. Téléchargez un fichier CSV et laissez notre agent IA vous guider.
        </p>
      </div>

      <Card 
        className={`relative w-full max-w-2xl p-12 transition-all duration-300 ${
          isDragging 
            ? "border-primary border-2 shadow-2xl scale-[1.02] bg-primary/5" 
            : "border-dashed border-2 hover:border-primary/50 hover:shadow-lg"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isLoading}
        />
        
        <label 
          htmlFor="file-upload" 
          className="flex flex-col items-center justify-center cursor-pointer space-y-6"
        >
          <div className={`rounded-full p-6 bg-primary/10 transition-all duration-300 ${
            isDragging ? "animate-pulse-glow" : ""
          }`}>
            {fileName ? (
              <CheckCircle2 className="w-16 h-16 text-primary" />
            ) : (
              <Upload className="w-16 h-16 text-primary" />
            )}
          </div>

          <div className="text-center space-y-2">
            {fileName ? (
              <>
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <FileText className="w-5 h-5" />
                  {fileName}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {backendStatus === 'uploading' && (
                    <>
                      <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-blue-600">Connexion à l'IA...</span>
                    </>
                  )}
                  {backendStatus === 'success' && (
                    <>
                      <Cloud className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Prêt pour l'analyse IA</span>
                    </>
                  )}
                  {backendStatus === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600">IA non disponible</span>
                    </>
                  )}
                  {backendStatus === 'idle' && (
                    <>
                      <CloudOff className="w-4 h-4 text-gray-400" />
                      <span className="text-muted-foreground">En attente de connexion</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold">
                  {isDragging ? "Déposez votre fichier ici" : "Glissez-déposez votre fichier CSV"}
                </p>
                <p className="text-sm text-muted-foreground">
                  ou cliquez pour sélectionner un fichier
                </p>
              </>
            )}
          </div>

          {!fileName && (
            <Button 
              type="button"
              size="lg"
              className="mt-4"
              disabled={isLoading}
            >
              Sélectionner un fichier
            </Button>
          )}
        </label>

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Chargement du dataset...</p>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Format CSV requis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Analyse en temps réel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Agent IA intégré</span>
        </div>
      </div>
    </div>
  );
};
