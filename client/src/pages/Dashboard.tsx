import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign, Scissors, Users } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: dailyStats, isLoading: loadingDaily } = trpc.stats.daily.useQuery({
    date: selectedDate,
  });

  const { data: monthlyStats, isLoading: loadingMonthly } = trpc.stats.monthly.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Preparar dados para o gráfico de evolução mensal
  const monthlyChartData = useMemo(() => {
    if (!monthlyStats?.dailyEvolution) return [];
    return monthlyStats.dailyEvolution.map((item: any) => ({
      date: formatDate(item.date),
      atendimentos: Number(item.count),
      receita: Number(item.revenue) / 100,
    }));
  }, [monthlyStats]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho da sua barbearia</p>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="daily">Estatísticas Diárias</TabsTrigger>
            <TabsTrigger value="monthly">Estatísticas Mensais</TabsTrigger>
          </TabsList>

          {/* ESTATÍSTICAS DIÁRIAS */}
          <TabsContent value="daily" className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Data:</label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                max={today}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {loadingDaily ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
                      <Scissors className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {dailyStats?.totalAppointments || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        atendimentos realizados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Receita do Dia</CardTitle>
                      <DollarSign className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {formatCurrency(dailyStats?.totalRevenue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        faturamento total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {dailyStats?.totalAppointments
                          ? formatCurrency(Math.round((dailyStats.totalRevenue || 0) / dailyStats.totalAppointments))
                          : formatCurrency(0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        valor médio por atendimento
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Cortes Mais Realizados</CardTitle>
                    <CardDescription>Ranking dos serviços mais procurados hoje</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!dailyStats?.topHaircuts || dailyStats.topHaircuts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum atendimento registrado nesta data
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {dailyStats.topHaircuts.map((item, index) => (
                          <div key={item.haircutId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{item.haircutName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.count} {Number(item.count) === 1 ? 'atendimento' : 'atendimentos'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ESTATÍSTICAS MENSAIS */}
          <TabsContent value="monthly" className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Mês:</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2024, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="text-sm font-medium">Ano:</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingMonthly ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
                      <Scissors className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {monthlyStats?.totalAppointments || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        atendimentos no mês
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                      <DollarSign className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {formatCurrency(monthlyStats?.totalRevenue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        faturamento total
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Evolução de Atendimentos</CardTitle>
                    <CardDescription>Atendimentos realizados por dia no mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyChartData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum atendimento registrado neste período
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="atendimentos"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name="Atendimentos"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ranking de Barbeiros</CardTitle>
                    <CardDescription>Desempenho dos barbeiros no mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!monthlyStats?.barberRanking || monthlyStats.barberRanking.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum atendimento registrado neste período
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {monthlyStats.barberRanking.map((barber, index) => (
                          <div key={barber.barberId} className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{barber.barberName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {barber.totalAppointments} {Number(barber.totalAppointments) === 1 ? 'atendimento' : 'atendimentos'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                {formatCurrency(Number(barber.totalRevenue))}
                              </p>
                              <p className="text-xs text-muted-foreground">receita gerada</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
