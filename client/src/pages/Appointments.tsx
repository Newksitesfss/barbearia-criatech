import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";

export default function Appointments() {
  const [formData, setFormData] = useState({
    barberId: "",
    haircutId: "",
    appointmentDate: "",
    appointmentTime: "",
    pricePaid: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: barbers } = trpc.barbers.list.useQuery({ activeOnly: true });
  const { data: haircuts } = trpc.haircuts.list.useQuery({ activeOnly: true });
  
  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Atendimento registrado com sucesso!");
      utils.appointments.list.invalidate();
      utils.stats.daily.invalidate();
      utils.stats.monthly.invalidate();
      setFormData({
        barberId: "",
        haircutId: "",
        appointmentDate: "",
        appointmentTime: "",
        pricePaid: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.barberId || !formData.haircutId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const dateTimeString = `${formData.appointmentDate}T${formData.appointmentTime}`;
    const appointmentDate = new Date(dateTimeString);
    const priceInCents = Math.round(parseFloat(formData.pricePaid) * 100);

    createMutation.mutate({
      barberId: parseInt(formData.barberId),
      haircutId: parseInt(formData.haircutId),
      appointmentDate,
      pricePaid: priceInCents,
      notes: formData.notes,
    });
  };

  const handleHaircutChange = (haircutId: string) => {
    setFormData({ ...formData, haircutId });
    
    // Auto-preencher o preço baseado no corte selecionado
    const selectedHaircut = haircuts?.find(h => h.id === parseInt(haircutId));
    if (selectedHaircut) {
      setFormData(prev => ({
        ...prev,
        haircutId,
        pricePaid: (selectedHaircut.price / 100).toFixed(2),
      }));
    }
  };

  // Definir data e hora padrão como agora
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Scissors className="h-10 w-10 text-primary" />
              Registrar Atendimento
            </h1>
            <p className="text-muted-foreground">Registre um novo atendimento realizado na barbearia</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dados do Atendimento</CardTitle>
              <CardDescription>Preencha as informações abaixo para registrar o atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="barberId">Barbeiro *</Label>
                    <Select
                      value={formData.barberId}
                      onValueChange={(value) => setFormData({ ...formData, barberId: value })}
                    >
                      <SelectTrigger id="barberId">
                        <SelectValue placeholder="Selecione o barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers?.map((barber) => (
                          <SelectItem key={barber.id} value={barber.id.toString()}>
                            {barber.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="haircutId">Tipo de Corte *</Label>
                    <Select
                      value={formData.haircutId}
                      onValueChange={handleHaircutChange}
                    >
                      <SelectTrigger id="haircutId">
                        <SelectValue placeholder="Selecione o corte" />
                      </SelectTrigger>
                      <SelectContent>
                        {haircuts?.map((haircut) => (
                          <SelectItem key={haircut.id} value={haircut.id.toString()}>
                            {haircut.name} - R$ {(haircut.price / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate">Data *</Label>
                    <Input
                      id="appointmentDate"
                      type="date"
                      value={formData.appointmentDate || defaultDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentTime">Horário *</Label>
                    <Input
                      id="appointmentTime"
                      type="time"
                      value={formData.appointmentTime || defaultTime}
                      onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricePaid">Valor Pago (R$) *</Label>
                    <Input
                      id="pricePaid"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePaid}
                      onChange={(e) => setFormData({ ...formData, pricePaid: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais sobre o atendimento (opcional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({
                      barberId: "",
                      haircutId: "",
                      appointmentDate: "",
                      appointmentTime: "",
                      pricePaid: "",
                      notes: "",
                    })}
                    className="flex-1"
                  >
                    Limpar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Registrar Atendimento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
