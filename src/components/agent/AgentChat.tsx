import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AgentChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I'm your CADD-SBDD AI agent. I can help you automate the entire drug discovery pipeline:\n\n• Search and add proteins from PDB\n• Find ligands from PubChem or Kaggle datasets\n• Import large ligand libraries from Kaggle\n• Run ADMET safety screening\n• Perform molecular docking\n• Analyze results and generate reports\n\nTry asking me: \"Find SARS-CoV-2 3CLpro inhibitors\" or \"Search Kaggle for drug compound datasets\""
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('cadd-agent', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      if (data.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      }

      if (data.iterations > 5) {
        toast({
          title: "Complex Workflow Completed",
          description: `Agent executed ${data.iterations} steps to complete your request.`,
        });
      }
    } catch (error: any) {
      console.error('Agent error:', error);
      toast({
        variant: "destructive",
        title: "Agent Error",
        description: error.message || "Failed to process request",
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error processing your request. Please try again or rephrase your question."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    "Find SARS-CoV-2 3CLpro inhibitors - search Kaggle first, then PubChem",
    "Search Kaggle for COVID-19 drug datasets",
    "Run complete EGFR inhibitor analysis",
    "Analyze top docking results"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Drug Discovery Agent</h2>
            <p className="text-sm text-muted-foreground">Automated CADD-SBDD pipeline orchestration</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4"
              onClick={() => setInput(action)}
            >
              <span className="text-sm">{action}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Messages */}
      <Card className="flex-1 p-4">
        <ScrollArea className="h-full pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`rounded-lg px-4 py-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Input */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the AI agent to run workflows, analyze data, or generate reports..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </Card>
    </div>
  );
};
