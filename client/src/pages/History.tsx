import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Filter, X } from "lucide-react";

export default function History() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    barberId: "",
    haircutId: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    barberId?: number;
    haircutId?: number;
  }>({});

  const { data: barbers } = trpc.barbers.list.useQuery();
  const { data: haircuts } = trpc.haircuts.list.useQuery();
  const { data: appointments, isLoading } = trpc.appointments.list.useQuery(appliedFilters);

  const handleApplyFilters = () => {
    const newFilters: typeof appliedFilters = {};

    if (filters.startDate) {
      newFilters.startDate = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      newFilters.endDate = endDate;
    }
    if (filters.barberId) {
      newFilters.barberId = parseInt(filters.barberId);
    }
    if (filters.haircutId) {
      newFilters.haircutId = parseInt(filters.haircutId);
    }

    setAppliedFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      barberId: "",
      haircutId: "",
    });
    setAppliedFilters({});
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calcular totais
  const totals = useMemo(() => {
    if (!appointments) return { count: 0, revenue: 0 };
    return {
      count: appointments.length,
      revenue: appointments.reduce((sum, apt) => sum + apt.pricePaid, 0),
    };
  }, [appointments]);

  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== undefined);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Histórico de Atendimentos</h1>
          <p className="text-muted-foreground">Consulte todos os atendimentos realizados</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>Filtre os atendimentos por período, barbeiro ou tipo de corte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barberId">Barbeiro</Label>
                <Select
                  value={filters.barberId}
                  onValueChange={(value) => setFilters({ ...filters, barberId: value })}
                >
                  <SelectTrigger id="barberId">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {barbers?.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id.toString()}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="haircutId">Tipo de Corte</Label>
                <Select
                  value={filters.haircutId}
                  onValueChange={(value) => setFilters({ ...filters, haircutId: value })}
                >
                  <SelectTrigger id="haircutId">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {haircuts?.map((haircut) => (
                      <SelectItem key={haircut.id} value={haircut.id.toString()}>
                        {haircut.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleApplyFilters} className="gap-2">
                <Filter className="h-4 w-4" />
                Aplicar Filtros
              </Button>
              {hasActiveFilters && (
                <Button onClick={handleClearFilters} variant="outline" className="gap-2">
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        {hasActiveFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totals.count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totals.revenue)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela de Atendimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos Registrados</CardTitle>
            <CardDescription>
              {hasActiveFilters
                ? "Resultados filtrados"
                : "Todos os atendimentos do sistema"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !appointments || appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {hasActiveFilters
                  ? "Nenhum atendimento encontrado com os filtros aplicados"
                  : "Nenhum atendimento registrado ainda"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Barbeiro</TableHead>
                      <TableHead>Tipo de Corte</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {formatDateTime(appointment.appointmentDate)}
                        </TableCell>
                        <TableCell>{appointment.barberName}</TableCell>
                        <TableCell>{appointment.haircutName}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatCurrency(appointment.pricePaid)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {appointment.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
