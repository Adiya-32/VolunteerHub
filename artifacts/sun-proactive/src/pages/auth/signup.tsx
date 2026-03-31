import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Sun, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, { message: "Аты-жөні кемінде 2 таңбадан тұруы керек." }),
  email: z.string().email({ message: "Жарамсыз электрондық пошта мекенжайы." }),
  password: z.string().min(6, { message: "Құпиясөз кемінде 6 таңбадан тұруы керек." }),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Құпиясөздер сәйкес келмейді.",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      await signup(values.name, values.email, values.password);
      toast({ title: "Тіркелу сәтті аяқталды!", description: "Sun Proactive қоғамдастығына қош келдіңіз." });
      setLocation("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Тіркелу сәтсіз аяқталды",
        description: err.message ?? "Тіркелу кезінде қате пайда болды.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Тіркелу</h1>
          <p className="text-muted-foreground mt-2">Жаңа Sun Proactive аккаунтын жасаңыз</p>
        </div>

        <Card className="shadow-xl border-border/50 rounded-2xl">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Аты-жөні</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Айгерім Бекова"
                          className="h-12 rounded-xl bg-background"
                          {...field}
                        />
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
                      <FormLabel className="font-semibold">Электрондық пошта</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="siz@example.com"
                          className="h-12 rounded-xl bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Құпиясөз</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Кемінде 6 таңба"
                            className="h-12 rounded-xl bg-background pr-12"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Құпиясөзді растау</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Құпиясөзді қайта енгізіңіз"
                          className="h-12 rounded-xl bg-background"
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
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-primary to-orange-500 hover:shadow-lg hover:shadow-primary/20 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Тіркелу...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Тіркелу
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-0">
            <p className="text-sm text-center text-muted-foreground w-full">
              Аккаунтыңыз бар ма?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Кіру
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
