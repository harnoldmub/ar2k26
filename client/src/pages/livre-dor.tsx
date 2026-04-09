import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  MessageCircle,
  PenSquare,
  Quote,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { insertGuestbookEntrySchema, type InsertGuestbookEntry } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import guestbookCenterPhoto from "../assets/guestbook-center.jpg";

type GuestbookMessage = {
  id: string;
  authorName: string;
  message: string;
  createdAt: string | null;
  source: "guestbook" | "contribution";
};

const cloudSlots = [
  { className: "xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[250px] xl:-translate-x-[610px] xl:-translate-y-[320px] xl:-rotate-6" },
  { className: "xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[270px] xl:-translate-x-[520px] xl:-translate-y-[40px] xl:rotate-3" },
  { className: "xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[250px] xl:-translate-x-[500px] xl:translate-y-[250px] xl:-rotate-2" },
  { className: "xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[250px] xl:translate-x-[360px] xl:-translate-y-[320px] xl:rotate-6" },
  { className: "xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[270px] xl:translate-x-[320px] xl:-translate-y-[10px] xl:-rotate-3" },
  { className: "xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[250px] xl:translate-x-[300px] xl:translate-y-[250px] xl:rotate-2" },
];

const cardTones = [
  "from-[#fffaf2] via-[#fff5e7] to-[#f5ead7]",
  "from-[#fffef9] via-[#f8f1e6] to-[#f6ebdc]",
  "from-[#fdf7ef] via-[#fffaf5] to-[#f0e4d1]",
];

const floatingPhrases = [
  "autour de nous",
  "dans nos coeurs",
  "pour notre histoire",
  "dans ce nuage",
];

function formatGuestbookDate(date: string | null | undefined) {
  if (!date) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function GuestCloudCard({
  entry,
  index,
  className = "",
  compact = false,
}: {
  entry: GuestbookMessage;
  index: number;
  className?: string;
  compact?: boolean;
}) {
  const messageDate = formatGuestbookDate(entry.createdAt);
  const tone = cardTones[index % cardTones.length];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.04 * index }}
      whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.2 } }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 6 + (index % 3),
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2 * index,
        }}
      >
        <Card
          className={`overflow-hidden border-white/60 bg-gradient-to-br ${tone} shadow-[0_24px_80px_-36px_rgba(70,50,20,0.45)] backdrop-blur ${compact ? "p-5" : "p-6"}`}
          data-testid={`guestbook-entry-${entry.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-serif text-xl text-[#4c3921]">{entry.authorName}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#8f7652]">
                {messageDate ?? "Message d'affection"}
              </p>
            </div>
            <Quote className="h-5 w-5 shrink-0 text-[#c49a58]" />
          </div>

          <p className={`mt-4 font-serif leading-relaxed text-[#5a4630] ${compact ? "text-base" : "text-lg"}`}>
            “{entry.message}”
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function LivreDorPage() {
  const { toast } = useToast();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [featuredStartIndex, setFeaturedStartIndex] = useState(0);

  const form = useForm<InsertGuestbookEntry>({
    resolver: zodResolver(insertGuestbookEntrySchema),
    defaultValues: {
      authorName: "",
      message: "",
    },
  });

  const { data: messages = [], isLoading, isError } = useQuery<GuestbookMessage[]>({
    queryKey: ["/api/guestbook/messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/guestbook/messages");
      return response.json();
    },
  });

  const featuredMessages = useMemo(() => {
    if (messages.length === 0) return [];
    if (messages.length <= cloudSlots.length) return messages.slice(0, cloudSlots.length);

    return Array.from({ length: cloudSlots.length }, (_, index) => {
      const currentIndex = (featuredStartIndex + index) % messages.length;
      return messages[currentIndex];
    });
  }, [messages, featuredStartIndex]);

  const canShowNextFeatured = messages.length > cloudSlots.length;
  const publishMutation = useMutation({
    mutationFn: async (values: InsertGuestbookEntry) => {
      const response = await apiRequest("POST", "/api/guestbook/messages", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestbook/messages"] });
      form.reset();
      toast({
        title: "Message publie",
        description: "Votre mot doux vient d'etre ajoute au nuage de messages.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Publication impossible",
        description: error.message || "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: InsertGuestbookEntry) => {
    publishMutation.mutate({
      authorName: values.authorName.trim(),
      message: values.message.trim(),
    });
  };

  const showNextFeaturedMessages = () => {
    if (!canShowNextFeatured) return;
    setFeaturedStartIndex((current) => (current + 1) % messages.length);
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % floatingPhrases.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(221,189,127,0.22),_transparent_32%),linear-gradient(180deg,_#f8f3ea_0%,_#f4ebde_38%,_#efe4d1_100%)]">
      <section className="relative isolate px-6 pb-20 pt-6 md:px-10 md:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-6%] top-20 h-56 w-56 rounded-full bg-[#d7b57a]/18 blur-3xl" />
          <div className="absolute right-[-4%] top-28 h-72 w-72 rounded-full bg-[#8d5d33]/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <Link href="/">
            <Button
              variant="ghost"
              className="border border-[#cfb287]/30 bg-white/60 text-[#4d3920] backdrop-blur hover:bg-white/80"
              data-testid="button-back-home-guestbook"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>

          <div className="mx-auto mt-10 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfb287]/40 bg-white/60 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#876337] backdrop-blur">
              <MessageCircle className="h-4 w-4" />
              Livre d'or
            </div>

            <h1 className="mt-6 font-serif text-4xl leading-tight text-[#4b351b] md:text-5xl">
              Vos mots doux
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm uppercase tracking-[0.24em] text-[#8e7149] md:text-[13px]">
              Quelques attentions suspendues{" "}
              <span
                key={floatingPhrases[phraseIndex]}
                className="inline-block animate-in fade-in duration-500"
              >
                {floatingPhrases[phraseIndex]}
              </span>
            </p>
          </div>

          <div className="relative mt-10 xl:min-h-[880px]">
            <div className="grid gap-5 xl:hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mx-auto w-full max-w-md"
              >
                <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 p-3 shadow-[0_35px_120px_-45px_rgba(72,48,18,0.55)] backdrop-blur">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_45%)]" />
                  <div className="relative overflow-hidden rounded-[1.5rem]">
                    <img
                      src={guestbookCenterPhoto}
                      alt="Ruth & Arnold"
                      className="aspect-[4/5] w-full object-cover object-center"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#21160f]/70 via-[#21160f]/20 to-transparent p-6">
                      <p className="font-serif text-3xl text-white">Ruth & Arnold</p>
                      <p className="mt-2 text-sm uppercase tracking-[0.28em] text-white/80">
                        Notre nuage de souvenirs
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid gap-4 md:grid-cols-2">
                {featuredMessages.map((entry, index) => (
                  <GuestCloudCard key={entry.id} entry={entry} index={index} compact />
                ))}
              </div>

              {canShowNextFeatured && (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={showNextFeaturedMessages}
                    className="border-[#cfb287]/40 bg-white/70 text-[#6f5533] hover:bg-white"
                    data-testid="button-next-featured-messages-mobile"
                  >
                    Suivante
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden xl:block">
              {canShowNextFeatured && (
                <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={showNextFeaturedMessages}
                    className="border-[#cfb287]/40 bg-white/75 text-[#6f5533] shadow-sm backdrop-blur hover:bg-white"
                    data-testid="button-next-featured-messages"
                  >
                    Suivante
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.65 }}
                  className="relative w-[420px]"
                >
                  <div className="relative">
                    <div className="absolute inset-[-28px] rounded-[2.8rem] border border-[#d8b57e]/40 bg-white/35 blur-[2px]" />
                    <div className="absolute inset-[-50px] rounded-[3.2rem] border border-white/30" />

                    <div className="relative overflow-hidden rounded-[2.6rem] border border-white/80 bg-white/65 p-4 shadow-[0_40px_120px_-45px_rgba(72,48,18,0.65)] backdrop-blur-xl">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_48%)]" />
                      <div className="relative overflow-hidden rounded-[2rem]">
                        <img
                          src={guestbookCenterPhoto}
                          alt="Ruth & Arnold"
                          className="aspect-[4/5] w-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#24180f]/65 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                          <p className="font-serif text-4xl">Ruth & Arnold</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {featuredMessages.map((entry, index) => {
                const slot = cloudSlots[index];
                return (
                  <div key={entry.id} className={slot.className}>
                    <GuestCloudCard entry={entry} index={index} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#d8bf98]" />
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6b42]">Mur des messages</p>
              <div className="h-px flex-1 bg-[#d8bf98]" />
            </div>

            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <Card
                    key={index}
                    className="min-h-[220px] animate-pulse border-white/60 bg-white/60 p-6"
                  />
                ))}
              </div>
            ) : isError ? (
              <Card className="border-destructive/20 bg-white/85 p-8 text-center">
                <p className="font-serif text-2xl text-foreground">Impossible de charger le nuage de messages.</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Le design est pret, mais les messages n'ont pas pu etre recuperes pour le moment.
                </p>
              </Card>
            ) : messages.length === 0 ? (
              <Card className="border-white/70 bg-white/75 p-10 text-center shadow-[0_18px_50px_-30px_rgba(92,79,61,0.55)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d8b57e]/15">
                  <MessageCircle className="h-7 w-7 text-[#9d7440]" />
                </div>
                <h2 className="mt-5 font-serif text-3xl text-[#4b351b]">Le nuage attend son premier message.</h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#7a6141]">
                  Les mots du livre d'or et ceux de la cagnotte apparaitront ici dans cette
                  composition des qu'ils seront disponibles.
                </p>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {messages.map((entry, index) => (
                  <GuestCloudCard key={entry.id} entry={entry} index={index} />
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="sticky top-8 border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_-36px_rgba(70,50,20,0.45)] backdrop-blur-xl md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d8b57e]/15 text-[#8f6635]">
                  <PenSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl text-[#4b351b]">Ajouter un message</h2>
                  <p className="mt-1 text-sm text-[#7a6141]">
                    Il sera melange au nuage avec les messages de la cagnotte.
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#5b4427]">Votre nom</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex. Grace & Patrick"
                            className="h-12 border-[#dcc3a0] bg-white/70"
                            data-testid="input-guestbook-author-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#5b4427]">Votre message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Un mot doux, un voeu, un souvenir, une benediction..."
                            className="min-h-[180px] resize-none border-[#dcc3a0] bg-white/70"
                            data-testid="textarea-guestbook-message"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between text-xs text-[#8a6b42]">
                          <span>Minimum 8 caracteres</span>
                          <span>{field.value?.length ?? 0}/1200</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="h-12 w-full bg-[#9b6f3a] text-base text-white hover:bg-[#865e30]"
                    disabled={publishMutation.isPending}
                    data-testid="button-submit-guestbook-message"
                  >
                    {publishMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publication en cours...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Publier dans le nuage
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
