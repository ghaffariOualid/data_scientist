import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, BarChart3, Loader2, MessageSquare, X, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { PlotlyVisualization } from "./PlotlyVisualization";

interface AIChatProps {
  data: any[];
  headers: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "visualization";
  plotData?: any;
}

export const AIChat = ({ data, headers }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "🤖 Bonjour ! Je suis votre assistant IA d'analyse de données.\n\n💡 **Pour commencer :**\n• Chargez un fichier CSV ci-dessus\n• Posez-moi des questions sur vos données\n• Demandez des visualisations\n\n📊 Je peux analyser, visualiser et répondre à toutes vos questions sur le dataset !",
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [isCreatingVisualization, setIsCreatingVisualization] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [currentPlotData, setCurrentPlotData] = useState<any>(null);
  const [hasBackendData, setHasBackendData] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Check if data is available in backend using React Query
  const { data: backendInfo } = useQuery({
    queryKey: ["dataInfo", data.length], // Re-check when data changes
    queryFn: async () => {
      const result = await ApiService.getDataInfo();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    retry: true,
    refetchInterval: (query) => {
      // Poll every 2 seconds if we have local data but no backend data yet
      if (data.length > 0 && query.state.status === 'error') return 2000;
      return false;
    },
    enabled: data.length > 0, // Only check if we have local data
  });

  useEffect(() => {
    if (backendInfo) {
      setHasBackendData(true);
    } else {
      setHasBackendData(false);
    }
  }, [backendInfo]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const analyzeMutation = useMutation({
    mutationFn: ApiService.analyzeData,
    onSuccess: (result) => {
      if (result.error) {
        throw new Error(result.error);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.data?.analysis || "Désolé, je n'ai pas pu traiter votre demande.",
          type: "text",
        },
      ]);
    },
    onError: (error) => {
      console.error("Erreur:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Erreur d'analyse", {
        description: errorMessage,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Désolé, une erreur s'est produite: ${errorMessage}. Veuillez réessayer.`,
          type: "text",
        },
      ]);
    },
  });

  const handleSend = async () => {
    if (!input.trim() || analyzeMutation.isPending) return;

    // Check if data is available
    if (!hasBackendData) {
      toast.error("Données non disponibles", {
        description: "Veuillez d'abord charger un fichier CSV et attendre la confirmation de l'IA",
      });
      return;
    }

    const userMessage = input.trim();
    if (userMessage.length < 3) {
      toast.error("Question trop courte", {
        description: "Veuillez poser une question plus détaillée (minimum 3 caractères)",
      });
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, type: "text" }]);

    analyzeMutation.mutate(userMessage);
  };

  const visualizeMutation = useMutation({
    mutationFn: ApiService.createVisualization,
    onSuccess: (result, variables) => {
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data?.visualization) {
        setCurrentPlotData(result.data.visualization);
        setShowVisualization(true);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `J'ai créé une visualisation basée sur votre demande: "${variables}"`,
            type: "visualization",
            plotData: result.data.visualization,
          },
        ]);
      } else {
        throw new Error("Aucune visualisation générée");
      }
    },
    onError: (error) => {
      console.error("Erreur de visualisation:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Erreur de visualisation", {
        description: errorMessage,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Désolé, je n'ai pas pu créer la visualisation: ${errorMessage}. Veuillez réessayer.`,
          type: "text",
        },
      ]);
    }
  });

  const handleCreateVisualization = async () => {
    if (!input.trim() || visualizeMutation.isPending) return;

    // Check if data is available
    if (!hasBackendData) {
      toast.error("Données non disponibles", {
        description: "Veuillez d'abord charger un fichier CSV et attendre la confirmation de l'IA",
      });
      return;
    }

    const prompt = input.trim();
    if (prompt.length < 3) {
      toast.error("Description trop courte", {
        description: "Veuillez décrire plus précisément la visualisation souhaitée (minimum 3 caractères)",
      });
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, {
      role: "user",
      content: `Créer une visualisation: ${prompt}`,
      type: "text"
    }]);

    visualizeMutation.mutate(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 h-16 w-16 rounded-full shadow-elegant z-50 hover:scale-110 transition-all duration-300 bg-gradient-to-r from-primary to-accent border-2 border-white/20 p-0 overflow-hidden"
        size="icon"
      >
        <img src="/ai-logo.png" alt="AI Assistant" className="w-full h-full object-cover" />
      </Button>
    );
  }

  return (
    <Card ref={chatRef} className="h-[600px] w-[400px] flex flex-col shadow-elegant fixed right-6 bottom-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 bg-background/80 backdrop-blur-xl border-white/10">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-full bg-primary/20">
            <img src="/ai-logo.png" alt="AI" className="w-8 h-8 rounded-full object-cover" />
          </div>
          <div>
            <h3 className="font-semibold">Assistant IA</h3>
            <p className="text-xs text-muted-foreground">Analyse conversationnelle</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
          <Minimize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src="/ai-logo.png" alt="AI" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 backdrop-blur-sm"
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.type === "visualization" && message.plotData && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPlotData(message.plotData);
                        setShowVisualization(true);
                      }}
                      className="gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Voir la visualisation
                    </Button>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}
          {(analyzeMutation.isPending || visualizeMutation.isPending) && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                <img src="/ai-logo.png" alt="AI" className="w-full h-full object-cover" />
              </div>
              <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {visualizeMutation.isPending ? "Création de la visualisation..." : "Analyse en cours..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        {!hasBackendData && data.length > 0 && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Connexion IA en cours...</strong> Veuillez patienter que l'upload se termine avant d'analyser vos données.
            </p>
          </div>
        )}

        {!hasBackendData && data.length === 0 && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📁 <strong>Chargez d'abord un fichier CSV</strong> pour pouvoir analyser vos données avec l'IA.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !hasBackendData
                ? "Veuillez d'abord charger un fichier CSV..."
                : "Exemples: 'Quel est le revenu moyen ?', 'Montre-moi un graphique des ventes', 'Analyse les tendances'... 💭"
            }
            className="min-h-[60px] resize-none"
            disabled={analyzeMutation.isPending || visualizeMutation.isPending || !hasBackendData}
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleSend}
              disabled={!input.trim() || analyzeMutation.isPending || visualizeMutation.isPending || !hasBackendData}
              size="icon"
              className="h-[29px] w-[60px]"
              title={!hasBackendData ? "Chargez d'abord un CSV" : "Envoyer la question"}
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleCreateVisualization}
              disabled={!input.trim() || analyzeMutation.isPending || visualizeMutation.isPending || !hasBackendData}
              size="icon"
              variant="outline"
              className="h-[29px] w-[60px]"
              title={!hasBackendData ? "Chargez d'abord un CSV" : "Créer une visualisation"}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2 space-y-1">

          {hasBackendData && (
            <p className="text-green-600">✅ <strong>Prêt :</strong> L'IA peut analyser vos données</p>
          )}
        </div>
      </div>

      {/* Plotly Visualization Modal */}
      <PlotlyVisualization
        plotData={currentPlotData}
        isOpen={showVisualization}
        onClose={() => setShowVisualization(false)}
        onRefresh={() => {
          if (input.trim()) {
            handleCreateVisualization();
          }
        }}
      />
    </Card>
  );
};
