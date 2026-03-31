import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateVolunteer } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SKILLS = [
  "Teaching", "Mentoring", "Cooking", "First Aid", "Driving", 
  "Translation", "Tech Support", "Event Planning", "Fundraising", 
  "Gardening", "Construction", "Medical", "Legal", "Accounting", 
  "Marketing", "Photography", "Music", "Sports Coaching", "Counseling", "Data Entry"
];

const formSchema = z.object({
  name: z.string().min(2, { message: "Аты-жөні кемінде 2 таңбадан тұруы керек." }),
  email: z.string().email({ message: "Жарамсыз электрондық пошта мекенжайы." }),
  phone: z.string().optional(),
  skills: z.array(z.string()).min(1, { message: "Кемінде бір дағды таңдаңыз." }),
  availability: z.enum(["weekdays", "weekends", "evenings", "flexible"]),
  location: z.string().optional(),
  bio: z.string().optional(),
});

export default function VolunteerRegister() {
  const [, setLocation] = useLocation();
  const { mutateAsync: createVolunteer, isPending } = useCreateVolunteer();
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      skills: [],
      availability: "flexible",
      location: "",
      bio: "",
    },
  });

  const toggleSkill = (skill: string) => {
    const current = form.getValues("skills");
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    form.setValue("skills", updated, { shouldValidate: true });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createVolunteer({ data: values });
      setSuccess(true);
      toast({
        title: "Тіркелу сәтті аяқталды!",
        description: "Sun Proactive қоғамдастығына қош келдіңіз.",
      });
      setTimeout(() => setLocation("/volunteer/directory"), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Тіркелу сәтсіз аяқталды",
        description: "Профиліңізді жіберу кезінде қате орын алды. Қайталап көріңіз.",
      });
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground">Бәрі дайын!</h2>
          <p className="text-muted-foreground text-lg">
            Қосылғаныңызға рахмет. Жаңа профиліңізді көру үшін каталогқа бағыттаймыз.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center rounded-full bg-secondary/30 px-3 py-1 text-sm font-medium text-secondary-foreground mb-2">
          <Sparkles className="mr-2 h-4 w-4" />
          Қоғамдастыққа қосылу
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">Еріктілер тіркелімі</h1>
        <p className="text-muted-foreground text-lg">Дағдыларыңыз бен мүмкіндіктеріңіз туралы айтыңыз — тиімді мүмкіндіктерге сәйкестендірейік.</p>
      </div>

      <Card className="shadow-xl shadow-black/5 border-border/50 rounded-2xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Аты-жөні</FormLabel>
                      <FormControl>
                        <Input placeholder="Айгерім Бекова" className="h-12 rounded-xl bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Электрондық пошта</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="aigerim@example.com" className="h-12 rounded-xl bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Телефон нөмірі (міндетті емес)</FormLabel>
                      <FormControl>
                        <Input placeholder="+7 (777) 123-4567" className="h-12 rounded-xl bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Орналасқан жер / Қала (міндетті емес)</FormLabel>
                      <FormControl>
                        <Input placeholder="Алматы, Қазақстан" className="h-12 rounded-xl bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <h3 className="text-lg font-display font-semibold">Сіздің дағдыларыңыз</h3>
                  <p className="text-sm text-muted-foreground">Барлық сәйкес дағдыларды таңдаңыз. Бұл дәл сәйкестендіруге көмектеседі.</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="skills"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {SKILLS.map((skill) => {
                            const isSelected = form.watch("skills").includes(skill);
                            return (
                              <Badge
                                key={skill}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer px-4 py-2 text-sm rounded-xl transition-all duration-200 no-default-active-elevate ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                    : "hover:border-primary/50 hover:bg-primary/5 text-foreground bg-background"
                                }`}
                                onClick={() => toggleSkill(skill)}
                              >
                                {skill}
                              </Badge>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Мүмкіндіктер кестесі</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-background">
                            <SelectValue placeholder="Мүмкіндікті таңдаңыз" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flexible">Икемді</SelectItem>
                          <SelectItem value="weekdays">Жұмыс күндері</SelectItem>
                          <SelectItem value="weekends">Демалыс күндері</SelectItem>
                          <SelectItem value="evenings">Кешкі уақыт</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Қысқаша өзіңіз туралы (міндетті емес)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Еріктілер жұмысына неге қатысқыңыз келетінін айтыңыз..." 
                        className="resize-none min-h-[120px] rounded-xl bg-background" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                size="lg" 
                disabled={isPending}
                className="w-full h-14 rounded-xl text-base font-bold bg-gradient-to-r from-primary to-orange-500 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                {isPending ? "Профиль жасалуда..." : "Еріктілер ретінде тіркелу"}
                {!isPending && <UserPlus className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
