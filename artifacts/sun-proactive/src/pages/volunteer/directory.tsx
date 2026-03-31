import React, { useState } from "react";
import { useListVolunteers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Search, Mail, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";

const ADMIN_EMAIL = "mikoplan23@gmail.com";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const AvailabilityLabels: Record<string, string> = {
  weekdays: "Жұмыс күндері",
  weekends: "Демалыс күндері",
  evenings: "Кешкі уақыт",
  flexible: "Икемді",
};

export default function VolunteerDirectory() {
  const { data: volunteers, isLoading, error } = useListVolunteers();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [pendingDialog, setPendingDialog] = useState<{ id: number; name: string } | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const filteredVolunteers = React.useMemo(() => {
    if (!volunteers) return [];
    const lower = searchTerm.toLowerCase();
    return volunteers.filter(v =>
      v.name.toLowerCase().includes(lower) ||
      v.skills.some(s => s.toLowerCase().includes(lower)) ||
      (v.location && v.location.toLowerCase().includes(lower))
    );
  }, [volunteers, searchTerm]);

  const handleDeleteClick = (id: number, name: string) => {
    if (isAdmin) {
      setDeleteTarget({ id, name });
    } else if (user) {
      setPendingDialog({ id, name });
      setPendingSuccess(false);
    } else {
      toast({ variant: "destructive", title: "Алдымен жүйеге кіріңіз." });
    }
  };

  const handleAdminDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${BASE}/api/volunteers/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Жою мүмкін болмады");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/volunteers"] });
      toast({ title: "Еріктілер жойылды!", description: `${deleteTarget.name} каталогтан алынды.` });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Қате", description: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRequestDelete = async () => {
    if (!pendingDialog || !user) return;
    setIsRequesting(true);
    try {
      const res = await fetch(`${BASE}/api/volunteers/${pendingDialog.id}/request-action`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "delete_volunteer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Сұраныс жіберу мүмкін болмады");
      setPendingSuccess(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Қате", description: err.message });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Еріктілер каталогы</h1>
          <p className="text-muted-foreground mt-1">Қоғамдастықтағы керемет адамдарды тауып, танысыңыз.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Аты немесе дағды бойынша іздеу..."
            className="pl-9 h-11 rounded-full bg-card shadow-sm border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Сіз әкімші ретінде кірдіңіз — еріктілерді тікелей жоюға болады.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="rounded-2xl border-border/40 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          <p>Еріктілерді жүктеу мүмкін болмады. Кейінірек қайталап көріңіз.</p>
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="text-center py-24 bg-card/50 rounded-3xl border border-dashed border-border">
          <p className="text-lg text-muted-foreground">Іздеуіңізге сәйкес еріктілер табылмады.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVolunteers.map((volunteer) => (
            <Card key={volunteer.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card overflow-hidden group">
              <CardHeader className="p-6 pb-0 flex flex-row items-start gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/10 group-hover:border-primary/30 transition-colors shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-display font-bold text-xl">
                    {volunteer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="font-display font-bold text-lg text-foreground truncate">{volunteer.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span className="truncate">{volunteer.location || "Қашықтан"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {volunteer.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{volunteer.bio}</p>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Дағдылар</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {volunteer.skills.slice(0, 5).map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 text-xs font-medium px-2 py-0.5 rounded-md">
                        {skill}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 5 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground px-2 py-0.5 rounded-md">
                        +{volunteer.skills.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1.5 text-primary/70" />
                    <span>{AvailabilityLabels[volunteer.availability] ?? volunteer.availability}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${volunteer.email}`} className="flex items-center text-primary font-medium hover:underline">
                      <Mail className="w-4 h-4 mr-1.5" />
                      Хабарласу
                    </a>
                    {user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${isAdmin ? "text-red-500 hover:bg-red-50 hover:text-red-600" : "text-muted-foreground hover:bg-muted"}`}
                        onClick={() => handleDeleteClick(volunteer.id, volunteer.name)}
                        title={isAdmin ? "Жою" : "Жою сұранысы"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admin: Confirm Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Еріктіні жою</DialogTitle>
            <DialogDescription className="text-base">
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span> атты еріктіні каталогтан жойғыңыз келе ме? Бұл әрекетті болдырмау мүмкін емес.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Бас тарту</Button>
            <Button
              variant="destructive"
              onClick={handleAdminDelete}
              disabled={isDeleting}
              className="rounded-xl"
            >
              {isDeleting ? "Жойылуда..." : "Жою"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Non-admin: Pending Approval Dialog */}
      <Dialog open={!!pendingDialog} onOpenChange={(open) => { if (!open) { setPendingDialog(null); setPendingSuccess(false); } }}>
        <DialogContent className="rounded-2xl max-w-md">
          {pendingSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-display text-center">Сұраныс жіберілді</DialogTitle>
                <DialogDescription className="text-center text-base">
                  Сіздің <span className="font-semibold text-foreground">{pendingDialog?.name}</span> атты еріктіні жою сұранысыңыз әкімшіге жіберілді. Бекіту күтілуде.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={() => { setPendingDialog(null); setPendingSuccess(false); }} className="w-full rounded-xl mt-2">
                Жабу
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-display flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Бекіту қажет
                </DialogTitle>
                <DialogDescription className="text-base">
                  <span className="font-semibold text-foreground">{pendingDialog?.name}</span> атты еріктіні жою үшін әкімші бекітуі қажет. Сұраныс жіберілсін бе?
                </DialogDescription>
              </DialogHeader>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                Сіздің сұранысыңыз әкімші тарапынан қаралатын болады. Бекітілген жағдайда ғана жою орындалады.
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setPendingDialog(null)} className="rounded-xl">Бас тарту</Button>
                <Button
                  onClick={handleRequestDelete}
                  disabled={isRequesting}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {isRequesting ? "Жіберілуде..." : "Сұраныс жіберу"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
