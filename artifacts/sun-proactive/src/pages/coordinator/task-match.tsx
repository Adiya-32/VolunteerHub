import React from "react";
import { useRoute, Link } from "wouter";
import {
  useGetTask,
  useGetTaskMatches,
  useCreateMatch,
  useListMatches
} from "@workspace/api-client-react";
import {
  ArrowLeft, CheckCircle2, UserPlus, Star,
  MapPin, Clock, Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const AvailabilityLabels: Record<string, string> = {
  weekdays: "Жұмыс күндері",
  weekends: "Демалыс күндері",
  evenings: "Кешкі уақыт",
  flexible: "Икемді",
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
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function TaskMatch() {
  const [, params] = useRoute("/coordinator/tasks/:id/match");
  const taskId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: task, isLoading: taskLoading } = useGetTask(taskId);
  const { data: matches, isLoading: matchesLoading, refetch: refetchMatches } = useGetTaskMatches(taskId);
  const { data: existingMatches, refetch: refetchExisting } = useListMatches();

  const createMatch = useCreateMatch();

  const isAssigned = (volunteerId: number) => {
    if (!existingMatches) return false;
    return existingMatches.some((m: any) => m.taskId === taskId && m.volunteerId === volunteerId);
  };

  const handleAssign = async (volunteerId: number, volunteerName: string) => {
    try {
      await createMatch.mutateAsync({ data: { taskId, volunteerId } });
      toast({
        title: "Еріктілер тағайындалды!",
        description: `${volunteerName} осы тапсырмаға тағайындалды.`,
      });
      refetchMatches();
      refetchExisting();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Тағайындау сәтсіз",
        description: "Еріктіні тағайындау мүмкін болмады. Мүмкін ол бұрын тағайындалған болар.",
      });
    }
  };

  if (taskLoading) {
    return (
      <div className="py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!task) {
    return <div className="py-12 text-center text-muted-foreground">Тапсырма табылмады.</div>;
  }

  const safeSkills: string[] = Array.isArray(task.requiredSkills) ? task.requiredSkills : [];
  const assignedCount = existingMatches?.filter((m: any) => m.taskId === taskId).length || 0;
  const progressPercent = task.volunteersNeeded > 0
    ? Math.min(100, Math.round((assignedCount / task.volunteersNeeded) * 100))
    : 0;
  const formattedDate = safeFormatDate(task.date);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div>
        <Link href="/coordinator/tasks" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Тапсырмаларға оралу
        </Link>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-md rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary w-full" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 justify-between">
              <div className="space-y-4 flex-1">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none rounded-md px-3 border-none">
                  {StatusLabels[task.status] ?? task.status.toUpperCase()}
                </Badge>
                <h1 className="text-3xl font-display font-bold text-foreground">{task.title}</h1>
                <p className="text-muted-foreground text-lg">{task.description}</p>

                <div className="flex flex-wrap gap-4 pt-2">
                  {formattedDate && (
                    <div className="flex items-center text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      {formattedDate}
                    </div>
                  )}
                  {task.location && (
                    <div className="flex items-center text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      {task.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-background rounded-xl p-5 border border-border/60 min-w-[240px] flex flex-col justify-center shadow-inner">
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex justify-between">
                  <span>Толтырылуы</span>
                  <span className="text-primary">{assignedCount} / {task.volunteersNeeded}</span>
                </div>
                <Progress value={progressPercent} className="h-3 bg-muted mb-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {progressPercent === 100
                    ? "Толық! Тамаша жұмыс."
                    : `Тағы ${task.volunteersNeeded - assignedCount} еріктілер қажет`}
                </p>
              </div>
            </div>

            {safeSkills.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/40">
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Сәйкестендіруге қажетті дағдылар</h3>
                <div className="flex flex-wrap gap-2">
                  {safeSkills.map(s => (
                    <Badge key={s} variant="outline" className="border-primary/20 bg-primary/5 text-primary font-medium rounded-lg px-3 py-1">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volunteer Matches */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-display font-bold">Ұсынылған сәйкестіктер</h2>
          <Badge className="bg-accent/20 text-accent-foreground border-none px-2 rounded-full">
            ЖИ Рейтингі
          </Badge>
        </div>

        {matchesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : !matches || (matches as any[]).length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-transparent shadow-none">
            <p className="text-muted-foreground">Осы дағдыларға сай еріктілер әлі табылмады.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {(matches as any[]).map((match, index) => {
              const assigned = isAssigned(match.volunteer?.id);
              const score = match.matchScore ?? 0;
              const skills: string[] = Array.isArray(match.matchingSkills) ? match.matchingSkills : [];
              const vol = match.volunteer ?? {};

              return (
                <Card
                  key={vol.id ?? index}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    assigned
                      ? "bg-muted/30 border-border/40 opacity-70"
                      : index === 0
                        ? "border-accent shadow-md shadow-accent/10"
                        : "border-border/50 hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-4 sm:p-6 gap-6">
                    {/* Score ring */}
                    <div className="flex flex-row sm:flex-col items-center gap-2 sm:w-20 shrink-0">
                      <div className="relative flex items-center justify-center w-14 h-14 bg-background rounded-full border-2 border-muted shadow-inner">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-muted" />
                          <circle
                            cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4"
                            className={score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-orange-400"}
                            strokeDasharray={150.8}
                            strokeDashoffset={150.8 - (150.8 * score) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="font-bold text-sm text-foreground relative z-10">{score}%</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Сәйкес</span>
                    </div>

                    {/* Volunteer info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="w-12 h-12 border border-border/50 shrink-0">
                        <AvatarFallback className="bg-secondary/20 text-secondary-foreground font-bold">
                          {(vol.name ?? "??").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate flex items-center gap-2">
                          {vol.name ?? "—"}
                          {index === 0 && !assigned && <Star className="w-4 h-4 fill-accent text-accent shrink-0" />}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {AvailabilityLabels[vol.availability] ?? vol.availability ?? "—"}
                          </span>
                          {vol.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {vol.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Matching skills */}
                    <div className="flex-1 hidden md:block min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase">Сәйкес дағдылар</p>
                      <div className="flex flex-wrap gap-1">
                        {skills.length > 0 ? skills.map(skill => (
                          <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800 text-[10px] px-1.5 rounded">
                            {skill}
                          </Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground">Сәйкес дағдылар жоқ</span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                      {assigned ? (
                        <Button disabled variant="outline" className="w-full sm:w-36 rounded-xl bg-muted/50 border-dashed text-muted-foreground h-11 font-semibold">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Тағайындалды
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleAssign(vol.id, vol.name)}
                          disabled={createMatch.isPending || progressPercent === 100}
                          className="w-full sm:w-36 rounded-xl h-11 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Тағайындау
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
