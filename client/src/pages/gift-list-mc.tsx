import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Gift, ChevronUp, ChevronDown, Trash2, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GiftListSignup } from "@shared/schema";
import logoRA from "@assets/logo-ra.png";

export default function GiftListMC() {
  const [localList, setLocalList] = useState<GiftListSignup[] | null>(null);

  const { data: serverList, isLoading } = useQuery<GiftListSignup[]>({
    queryKey: ["/api/gift-list"],
    refetchInterval: 10000,
    select: (data) => [...data].sort((a, b) => a.position - b.position),
  });

  const list = localList ?? serverList ?? [];

  const reorderMutation = useMutation({
    mutationFn: async (ordered: GiftListSignup[]) => {
      const order = ordered.map((item, idx) => ({ id: item.id, position: idx }));
      return apiRequest("PATCH", "/api/gift-list/reorder", { order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-list"] });
      setLocalList(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/gift-list/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-list"] });
      setLocalList(null);
    },
  });

  const recordedMutation = useMutation({
    mutationFn: async ({ id, isRecorded }: { id: number; isRecorded: boolean }) => {
      return apiRequest("PATCH", `/api/gift-list/${id}/recorded`, { isRecorded });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-list"] });
      setLocalList(null);
    },
  });

  const move = (idx: number, direction: "up" | "down") => {
    const base = localList ?? serverList ?? [];
    const current = [...base];
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= current.length) return;
    [current[idx], current[newIdx]] = [current[newIdx], current[idx]];
    setLocalList(current);
    reorderMutation.mutate(current);
  };

  const recordedCount = list.filter(i => i.isRecorded).length;

  const GOLD = "#B8943E";
  const DARK = "#2C2418";

  return (
    <div
      className="min-h-screen py-12 px-6"
      style={{ backgroundColor: "#FAF6F0", fontFamily: "'Lato', sans-serif" }}
    >
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <img src={logoRA} alt="R&A" className="h-12 w-auto mx-auto mb-4 opacity-70" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
            style={{ backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}40` }}>
            <Gift className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <h1
            className="text-3xl mb-1"
            style={{ color: DARK, fontFamily: "'Playfair Display', serif" }}
          >
            Liste de cadeaux
          </h1>
          <p className="text-sm" style={{ color: `${DARK}80` }}>
            Vue MC — {list.length} inscrite{list.length !== 1 ? "s" : ""}
            {recordedCount > 0 && (
              <span style={{ color: GOLD }}> · {recordedCount} enregistré{recordedCount !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
          </div>
        ) : list.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucune inscription pour l'instant.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {list.map((item, idx) => (
              <Card
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 transition-opacity ${item.isRecorded ? "opacity-60" : ""}`}
                data-testid={`row-guest-${item.id}`}
              >
                <span
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${GOLD}20`, color: GOLD }}
                >
                  {idx + 1}
                </span>

                <span
                  className={`flex-1 text-base font-medium transition-all ${item.isRecorded ? "line-through" : ""}`}
                  style={{ color: item.isRecorded ? `${DARK}60` : DARK }}
                  data-testid={`text-name-${item.id}`}
                >
                  {item.name}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => recordedMutation.mutate({ id: item.id, isRecorded: !item.isRecorded })}
                    disabled={recordedMutation.isPending}
                    title={item.isRecorded ? "Marquer comme non enregistré" : "Marquer comme enregistré"}
                    data-testid={`button-recorded-${item.id}`}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      item.isRecorded
                        ? "border-transparent text-white"
                        : "border-current hover:opacity-70"
                    }`}
                    style={{
                      backgroundColor: item.isRecorded ? GOLD : "transparent",
                      borderColor: item.isRecorded ? GOLD : `${DARK}40`,
                      color: item.isRecorded ? "white" : `${DARK}60`,
                    }}
                  >
                    {item.isRecorded && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(idx, "up")}
                    disabled={idx === 0 || reorderMutation.isPending}
                    data-testid={`button-up-${item.id}`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(idx, "down")}
                    disabled={idx === list.length - 1 || reorderMutation.isPending}
                    data-testid={`button-down-${item.id}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: `${DARK}50` }}>
          Actualisation automatique toutes les 10 secondes
        </p>
      </div>
    </div>
  );
}
