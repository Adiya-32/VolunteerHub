import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useChatMessage, useCreateTask } from "@workspace/api-client-react";
import type { ChatMessage, CreateTaskRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function CoordinatorChat() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Сәлеметсіз бе! Мен Арай — Sun Proactive платформасының еріктілік үйлестірушісімін. Бүгін қандай еріктілік тапсырма ұйымдастырғыңыз келеді?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useChatMessage();
  const createTaskMutation = useCreateTask();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const newMessages = [...messages, { role: "user" as const, content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync({ data: { messages: newMessages } });

      setMessages(prev => [
        ...prev,
        { role: "assistant" as const, content: response.message }
      ]);

      if (response.isComplete && response.taskData) {
        setMessages(prev => [
          ...prev,
          { role: "assistant" as const, content: JSON.stringify({ _type: "TASK_PROPOSAL", data: response.taskData }) }
        ]);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Байланыс қатесі",
        description: "Көмекшімен байланысу мүмкін болмады. Қайталап көріңіз.",
      });
    }
  };

  const handleConfirmTask = async (taskData: CreateTaskRequest) => {
    try {
      const created = await createTaskMutation.mutateAsync({ data: taskData });
      // Invalidate the tasks list so it refreshes when the user navigates back
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Тапсырма жасалды!",
        description: "Тапсырмаңыз сақталды және сәйкестендіруге дайын.",
      });
      setLocation(`/coordinator/tasks/${created.id}/match`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Қате",
        description: "Тапсырманы сақтау мүмкін болмады.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col pt-4">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          ЖИ Тапсырма жасаушы
        </h1>
        <p className="text-muted-foreground mt-1">Үйлестіруші Арайға қажеттіліктеріңізді айтыңыз — ол тапсырманы дұрыс форматқа келтіреді.</p>
      </div>

      <Card className="flex-1 flex flex-col border-border/50 shadow-xl overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm">
        <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-3xl mx-auto w-full pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";

                let isTaskProposal = false;
                let taskData: CreateTaskRequest | null = null;
                if (!isUser && msg.content.startsWith('{"_type":"TASK_PROPOSAL"')) {
                  try {
                    const parsed = JSON.parse(msg.content);
                    isTaskProposal = true;
                    taskData = parsed.data;
                  } catch (e) {}
                }

                if (isTaskProposal && taskData) {
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="my-8 mx-auto max-w-md w-full"
                    >
                      <Card className="border-primary/30 shadow-lg shadow-primary/5 bg-primary/5 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
                          <h3 className="font-display font-bold text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Тапсырма жобасы дайын
                          </h3>
                        </div>
                        <CardContent className="p-5 space-y-4">
                          <div>
                            <p className="text-xs font-bold uppercase text-muted-foreground">Атауы</p>
                            <p className="font-medium text-foreground">{taskData.title}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-muted-foreground">Қажет</p>
                            <p className="font-medium text-foreground">{taskData.volunteersNeeded} еріктілер</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-muted-foreground">Қажетті дағдылар</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {taskData.requiredSkills.map(s => (
                                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 bg-primary/5 border-t border-primary/10">
                          <Button
                            className="w-full font-bold shadow-md hover:shadow-lg transition-all"
                            onClick={() => handleConfirmTask(taskData!)}
                            disabled={createTaskMutation.isPending}
                          >
                            {createTaskMutation.isPending ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                Растау және сәйкес еріктілерді табу
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>

                    <div className={`px-5 py-3.5 rounded-2xl max-w-[80%] text-[15px] leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {chatMutation.isPending && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-card border border-border/50 rounded-tl-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border/40">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Хабарламаңызды жазыңыз..."
              className="pr-14 h-14 rounded-full bg-card shadow-sm border-border/60 text-base"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              className="absolute right-2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-md transition-transform active:scale-95"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
              Sun Proactive ЖИ қолдауымен жұмыс жасайды
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
