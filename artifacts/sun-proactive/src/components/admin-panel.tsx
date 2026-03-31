import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle, XCircle, Clock, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ActionTypeLabels: Record<string, string> = {
  delete_volunteer: "Еріктіні жою",
  edit_volunteer: "Еріктіні өңдеу",
};

const StatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  denied: "bg-red-100 text-red-800 border-red-200",
};

const StatusLabels: Record<string, string> = {
  pending: "Күтілуде",
  approved: "Бекітілді",
  denied: "Қабылданбады",
};

interface PendingAction {
  id: number;
  actionType: string;
  targetId: string;
  targetName: string;
  requestedByEmail: string;
  requestedByName: string;
  status: string;
  createdAt: string;
}

function safeFormatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/pending-actions`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setActions(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActions(); }, []);

  const handleDecision = async (id: number, decision: "approved" | "denied", targetName: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${BASE}/api/pending-actions/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Қате орын алды");
      }
      toast({
        title: decision === "approved" ? "Бекітілді" : "Қабылданбады",
        description: decision === "approved"
          ? `${targetName} еріктісін жою бекітілді.`
          : `${targetName} еріктісін жою сұранысы қабылданбады.`,
      });
      await fetchActions();
      if (decision === "approved") {
        await queryClient.invalidateQueries({ queryKey: ["/api/volunteers"] });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Қате", description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingActions = actions.filter(a => a.status === "pending");
  const resolvedActions = actions.filter(a => a.status !== "pending");

  return (
    <Card className="rounded-2xl border-amber-200 bg-amber-50/50 shadow-sm mt-8">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-lg font-display text-amber-900">Әкімші панелі</CardTitle>
          {pendingActions.length > 0 && (
            <Badge className="bg-amber-500 text-white border-none rounded-full text-xs px-2">
              {pendingActions.length}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-700 hover:bg-amber-100" onClick={fetchActions}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-amber-700 text-center py-4">Жүктелуде...</p>
        ) : actions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-amber-700">Бекітуді күтетін сұраныстар жоқ.</p>
          </div>
        ) : (
          <>
            {pendingActions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Күтілуде ({pendingActions.length})
                </h3>
                {pendingActions.map(action => (
                  <div key={action.id} className="bg-white rounded-xl border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {ActionTypeLabels[action.actionType] ?? action.actionType}:{" "}
                          <span className="text-primary">{action.targetName}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Сұраныс берген: <span className="font-medium">{action.requestedByName}</span> ({action.requestedByEmail})
                        </p>
                        <p className="text-xs text-muted-foreground">{safeFormatDate(action.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(action.id, "denied", action.targetName)}
                        disabled={processingId === action.id}
                        className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Бас тарту
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDecision(action.id, "approved", action.targetName)}
                        disabled={processingId === action.id}
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white h-8 text-xs font-semibold"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        {processingId === action.id ? "..." : "Бекіту"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resolvedActions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mt-2">Шешілгендер</h3>
                {resolvedActions.slice(-5).reverse().map(action => (
                  <div key={action.id} className="bg-white/60 rounded-xl border border-border/30 px-4 py-3 flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground min-w-0 truncate">
                      <span className="font-medium text-foreground">{action.targetName}</span> — {ActionTypeLabels[action.actionType] ?? action.actionType}
                    </p>
                    <Badge className={`text-[11px] border rounded-full px-2 py-0.5 shrink-0 ${StatusStyles[action.status]}`}>
                      {StatusLabels[action.status] ?? action.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
