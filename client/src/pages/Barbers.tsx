import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Power, Trash2 } from "lucide-react";

export default function Barbers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: barbers, isLoading } = trpc.barbers.list.useQuery();
  
  const createMutation = trpc.barbers.create.useMutation({
    onSuccess: () => {
      toast.success("Barbeiro cadastrado com sucesso!");
      utils.barbers.list.invalidate();
      setIsDialogOpen(false);
      setFormData({ name: "", phone: "", email: "" });
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = trpc.barbers.update.useMutation({
    onSuccess: () => {
      toast.success("Barbeiro atualizado com sucesso!");
      utils.barbers.list.invalidate();
      setIsDialogOpen(false);
      setEditingBarber(null);
      setFormData({ name: "", phone: "", email: "" });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const toggleActiveMutation = trpc.barbers.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.barbers.list.invalidate();
    },
  });

  const deleteMutation = trpc.barbers.delete.useMutation({
    onSuccess: () => {
      toast.success("Barbeiro deletado com sucesso!");
      utils.barbers.list.invalidate();
      setDeleteDialogOpen(false);
      setBarberToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBarber) {
      updateMutation.mutate({ id: editingBarber.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (barber: any) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name,
      phone: barber.phone || "",
      email: barber.email || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewBarber = () => {
    setEditingBarber(null);
    setFormData({ name: "", phone: "", email: "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Barbeiros</h1>
            <p className="text-muted-foreground">Gerencie os barbeiros da sua barbearia</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewBarber} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Novo Barbeiro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBarber ? "Editar Barbeiro" : "Novo Barbeiro"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do barbeiro abaixo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 text-sm"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingBarber ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Barbeiros</CardTitle>
            <CardDescription>Todos os barbeiros cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !barbers || barbers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum barbeiro cadastrado ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barbers.map((barber) => (
                    <TableRow key={barber.id}>
                      <TableCell className="font-medium">{barber.name}</TableCell>
                      <TableCell>{barber.phone || "-"}</TableCell>
                      <TableCell>{barber.email || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            barber.active === 1
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {barber.active === 1 ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(barber)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={barber.active === 1 ? "destructive" : "default"}
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: barber.id,
                                active: barber.active === 1 ? 0 : 1,
                              })
                            }
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setBarberToDelete(barber);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar o barbeiro <strong>{barberToDelete?.name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (barberToDelete) {
                    deleteMutation.mutate({ id: barberToDelete.id });
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
