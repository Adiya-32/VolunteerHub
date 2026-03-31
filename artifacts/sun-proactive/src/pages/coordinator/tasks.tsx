import React from "react";
import { Link } from "wouter";
import { useListTasks, useUpdateTaskStatus } from "@workspace/api-client-react";
import type { TaskStatus } from "@workspace/api-client-react";
import { Calendar, MapPin, Users, Plus, ChevronRight, MoreHorizontal, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const StatusColorMap: Record<string, { bg: string, text: string }> = {
  open: { bg: "bg-blue-100", text: "text-blue-700" },
  in_progress: { bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { bg: "bg-green-100", text: "text-green-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
};

const StatusLabels: Record<string, string> = {
  open: "Ашық",
  in_progress: "Орындалуда",
  completed: "Аяқталды",
  cancelled: "Болдырылмады",
};

function safeFormatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("kk-KZ", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function TasksBoard() {
  const { data: tasks, isLoading, refetch } = useListTasks();
  const updateStatus = useUpdateTaskStatus();

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await updateStatus.mutateAsync({ id: taskId, data: { status: newStatus } });
      toast({ title: "Күй сәтті жаңартылды" });
      refetch();
    } catch (err) {
      toast({ variant: "destructive", title: "Күйді жаңарту сәтсіз аяқталды" });
    }
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Тапсырмалар тақтасы</h1>
          <p className="text-muted-foreground mt-1">Мүмкіндіктерді басқарыңыз және сәйкестендіру үрдісін бақылаңыз.</p>
        </div>
        <Link href="/coordinator/chat">
          <Button className="rounded-xl font-semibold shadow-md shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" />
            Жаңа тапсырма жасау
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-2xl border-border/40 shadow-sm">
              <CardHeader className="space-y-2 pb-4">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border/60">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ListTodo className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">Тапсырмалар жоқ</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Еріктілермен сәйкестендіруді бастау үшін ЖИ көмекшімізді пайдаланып алғашқы тапсырмаңызды жасаңыз.</p>
          <Link href="/coordinator/chat">
            <Button>Тапсырма жасау</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const formattedDate = safeFormatDate(task.date);
            return (
              <Card key={task.id} className="flex flex-col rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all group bg-card">
                <CardHeader className="p-6 pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant="outline"
                      className={`uppercase text-[10px] tracking-wider font-bold border-transparent px-2.5 py-0.5 rounded-md ${StatusColorMap[task.status]?.bg ?? "bg-gray-100"} ${StatusColorMap[task.status]?.text ?? "text-gray-700"}`}
                    >
                      {StatusLabels[task.status] ?? task.status}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuLabel>Күйді өзгерту</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "open")}>Ашық</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "in_progress")}>Орындалуда</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}>Аяқталды</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "cancelled")} className="text-red-600">Тапсырманы болдырмау</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-display font-bold text-xl text-foreground leading-tight line-clamp-2">
                    {task.title}
                  </h3>
                </CardHeader>

                <CardContent className="p-6 pt-2 flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {task.description}
                  </p>

                  <div className="space-y-2 text-sm font-medium text-foreground/80 mb-4">
                    {formattedDate && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {formattedDate}
                        {task.duration && <span className="ml-1 text-muted-foreground">({task.duration} сағ)</span>}
                      </div>
                    )}
                    {task.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="truncate">{task.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-primary/70" />
                      <span className="text-primary font-bold">{task.volunteersNeeded}</span>
                      <span className="ml-1 text-muted-foreground font-normal">еріктілер қажет</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(task.requiredSkills ?? []).slice(0, 3).map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-secondary/30 text-secondary-foreground text-[10px] rounded px-2">
                        {skill}
                      </Badge>
                    ))}
                    {(task.requiredSkills ?? []).length > 3 && (
                      <Badge variant="outline" className="text-[10px] rounded px-2 text-muted-foreground">
                        +{task.requiredSkills.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-4 border-t border-border/40 bg-muted/20">
                  <Link href={`/coordinator/tasks/${task.id}/match`} className="w-full">
                    <Button variant="ghost" className="w-full justify-between font-semibold text-primary hover:text-primary hover:bg-primary/5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Сәйкес еріктілерді табу
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
