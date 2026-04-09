import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, CheckCircle, Table2, Eye, Tag, LayoutList } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RsvpResponse } from "@shared/schema";

interface DashboardWidgetsProps {
  responses: RsvpResponse[];
  onFilterChange?: (filter: string) => void;
}

export function DashboardWidgets({ responses, onFilterChange }: DashboardWidgetsProps) {
  // Filter responses by availability
  const availableFor19 = responses.filter((r) => r.availability === "both" || r.availability === "19-march");
  const availableFor21 = responses.filter((r) => r.availability === "both" || r.availability === "21-march");
  
  const stats = {
    total: responses.length,
    both: responses.filter((r) => r.availability === "both").length,
    march19Only: responses.filter((r) => r.availability === "19-march").length,
    march21Only: responses.filter((r) => r.availability === "21-march").length,
    unavailable: responses.filter((r) => r.availability === "unavailable").length,
    pending: responses.filter((r) => r.availability === "pending").length,
    assigned: responses.filter((r) => r.tableNumber !== null).length,
    totalGuests: responses.reduce((sum, r) => sum + r.partySize, 0),
    solo: responses.filter((r) => r.partySize === 1).length,
    couple: responses.filter((r) => r.partySize === 2).length,
    viewed: responses.filter((r) => r.invitationViewedAt).length,
    // Stats by invitation type (count of responses + total guests)
    type1: responses.filter((r) => (r.invitationType || 1) === 1),
    type2: responses.filter((r) => (r.invitationType || 1) === 2),
    type3: responses.filter((r) => (r.invitationType || 1) === 3),
    type4: responses.filter((r) => (r.invitationType || 1) === 4),
    // Stats for March 19
    solo19: availableFor19.filter((r) => r.partySize === 1).length,
    couple19: availableFor19.filter((r) => r.partySize >= 2).length,
    guests19: availableFor19.reduce((sum, r) => sum + (r.partySize || 1), 0),
    get invitations19() { return this.solo19 + this.couple19; },
    // Stats for March 21
    solo21: availableFor21.filter((r) => r.partySize === 1).length,
    couple21: availableFor21.filter((r) => r.partySize >= 2).length,
    guests21: availableFor21.reduce((sum, r) => sum + (r.partySize || 1), 0),
    get invitations21() { return this.solo21 + this.couple21; },
    // Stats plan de table — seatingConfirmed, couple = 2 personnes
    seatedInvitations: responses.filter((r) => r.seatingConfirmed).length,
    seatedGuests: responses.filter((r) => r.seatingConfirmed).reduce((sum, r) => sum + (r.partySize || 1), 0),
    get seatedSolo() { return responses.filter((r) => r.seatingConfirmed && r.partySize === 1).length; },
    get seatedCouple() { return responses.filter((r) => r.seatingConfirmed && r.partySize >= 2).length; },
  };
  
  const totalMarch19 = stats.march19Only + stats.both;
  const totalMarch21 = stats.march21Only + stats.both;

  const availabilityData = [
    { name: "Les deux dates", value: stats.both, color: "hsl(var(--primary))" },
    { name: "19 mars uniquement", value: stats.march19Only, color: "hsl(var(--chart-2))" },
    { name: "21 mars uniquement", value: stats.march21Only, color: "hsl(var(--chart-3))" },
    { name: "Indisponibles", value: stats.unavailable, color: "hsl(var(--muted-foreground))" },
    { name: "En attente", value: stats.pending, color: "hsl(var(--chart-4))" },
  ];

  const partySizeData = [
    { name: "Solo (1)", value: stats.solo, fill: "hsl(var(--chart-4))" },
    { name: "Couple (2)", value: stats.couple, fill: "hsl(var(--chart-5))" },
  ];

  const tableAssignmentData = [
    {
      name: "Attribués",
      value: stats.assigned,
      fill: "hsl(var(--chart-2))",
    },
    {
      name: "Non attribués",
      value: stats.total - stats.assigned,
      fill: "hsl(var(--muted))",
    },
  ];

  const confirmationRate = stats.total > 0
    ? Math.round(((stats.total - stats.unavailable) / stats.total) * 100)
    : 0;

  const statCards = [
    {
      title: "Total Invités",
      value: stats.totalGuests,
      description: `${stats.total} réponses`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "stat-total-guests",
      filter: "all",
      clickable: true,
    },
    {
      title: "Confirmations",
      value: stats.total - stats.unavailable - stats.pending,
      description: `${confirmationRate}% taux`,
      icon: CheckCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      testId: "stat-confirmations",
      filter: null,
      clickable: false,
    },
    {
      title: "Personnes le 19",
      value: stats.guests19,
      description: `${stats.invitations19} invit. · ${stats.couple19} groupes + ${stats.solo19} solo`,
      icon: Calendar,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      testId: "stat-march19-total",
      filter: "19-march",
      clickable: true,
    },
    {
      title: "Personnes le 21",
      value: stats.guests21,
      description: `${stats.invitations21} invit. · ${stats.couple21} groupes + ${stats.solo21} solo`,
      icon: Calendar,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      testId: "stat-march21-total",
      filter: "21-march",
      clickable: true,
    },
    {
      title: "Invitations vues",
      value: stats.viewed,
      description: `${stats.total > 0 ? Math.round((stats.viewed / stats.total) * 100) : 0}% ont ouvert`,
      icon: Eye,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      testId: "stat-invitations-viewed",
      filter: null,
      clickable: false,
    },
    {
      title: "Dans le plan",
      value: stats.seatedGuests,
      description: `${stats.seatedInvitations} fiches · ${stats.seatedCouple} couples (×2) + ${stats.seatedSolo} solo`,
      icon: LayoutList,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      testId: "stat-seated-guests",
      filter: null,
      clickable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const isClickable = stat.clickable && onFilterChange;
          return (
            <Card
              key={idx}
              className={`p-6 transition-all duration-300 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:shadow-lg' : ''}`}
              onClick={() => {
                if (isClickable && stat.filter) {
                  onFilterChange(stat.filter);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-sans text-muted-foreground mb-1">
                    {stat.title}
                    {isClickable && (
                      <span className="ml-2 text-[10px] text-primary opacity-70">(cliquer pour filtrer)</span>
                    )}
                  </p>
                  <p
                    className="text-3xl font-bold font-serif text-foreground mb-1"
                    data-testid={stat.testId}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-serif font-semibold text-lg">Répartition Disponibilité</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={availabilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {availabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-chart-4/10">
              <Users className="h-5 w-5 text-chart-4" />
            </div>
            <h3 className="font-serif font-semibold text-lg">Taille des groupes</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partySizeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {partySizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <Table2 className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="font-serif font-semibold text-lg">Plan de table</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tableAssignmentData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tableAssignmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Invitation Type Breakdown */}
        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-serif font-semibold text-lg">Répartition par type</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Type 1", desc: "Complet", rows: stats.type1, color: "bg-primary" },
              { label: "Type 2", desc: "Bénédiction + Soirée", rows: stats.type2, color: "bg-chart-2" },
              { label: "Type 3", desc: "Soirée uniquement", rows: stats.type3, color: "bg-chart-3" },
              { label: "Type 4", desc: "Mairie + Soirée", rows: stats.type4, color: "bg-chart-4" },
            ].map((t) => {
              const guestCount = t.rows.reduce((sum, r) => sum + r.partySize, 0);
              const pct = stats.total > 0 ? Math.round((t.rows.length / stats.total) * 100) : 0;
              return (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.color}`} />
                      <span className="text-sm font-medium font-sans">{t.label}</span>
                      <span className="text-xs text-muted-foreground font-sans">{t.desc}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-sans">
                      <span className="text-muted-foreground">{t.rows.length} fiches</span>
                      <span className="font-semibold text-foreground">{guestCount} invités</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${t.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
