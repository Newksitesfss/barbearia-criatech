import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Power, Trash2 } from "lucide-react";

export default function Haircuts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHaircut, setEditingHaircut] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", price: "", description: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [haircutToDelete, setHaircutToDelete] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: haircuts, isLoading } = trpc.haircuts.list.useQuery();
  
  const createMutation = trpc.haircuts.create.useMutation({
    onSuccess: () => {
      toast.success("Corte cadastrado com sucesso!");
      utils.haircuts.list.invalidate();
      setIsDialogOpen(false);
      setFormData({ name: "", price: "", description: "" });
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = trpc.haircuts.update.useMutation({
    onSuccess: () => {
      toast.success("Corte atualizado com sucesso!");
      utils.haircuts.list.invalidate();
      setIsDialogOpen(false);
      setEditingHaircut(null);
      setFormData({ name: "", price: "", description: "" });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const toggleActiveMutation = trpc.haircuts.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.haircuts.list.invalidate();
    },
  });

  const deleteMutation = trpc.haircuts.delete.useMutation({
    onSuccess: () => {
      toast.success("Corte deletado com sucesso!");
      utils.haircuts.list.invalidate();
      setDeleteDialogOpen(false);
      setHaircutToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceInCents = Math.round(parseFloat(formData.price) * 100);
    
    if (editingHaircut) {
      updateMutation.mutate({ 
        id: editingHaircut.id, 
        name: formData.name,
        price: priceInCents,
        description: formData.description 
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        price: priceInCents,
        description: formData.description
      });
    }
  };

  const handleEdit = (haircut: any) => {
    setEditingHaircut(haircut);
    setFormData({
      name: haircut.name,
      price: (haircut.price / 100).toFixed(2),
      description: haircut.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewHaircut = () => {
    setEditingHaircut(null);
    setFormData({ name: "", price: "", description: "" });
    setIsDialogOpen(true);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Tipos de Cortes</h1>
            <p className="text-muted-foreground">Gerencie os serviços oferecidos pela barbearia</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewHaircut} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Novo Corte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingHaircut ? "Editar Corte" : "Novo Corte"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do tipo de corte abaixo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Corte *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Corte Degradê"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional do serviço"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingHaircut ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cortes</CardTitle>
            <CardDescription>Todos os tipos de cortes cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !haircuts || haircuts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum tipo de corte cadastrado ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {haircuts.map((haircut) => (
                    <TableRow key={haircut.id}>
                      <TableCell className="font-medium">{haircut.name}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatPrice(haircut.price)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {haircut.description || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            haircut.active === 1
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {haircut.active === 1 ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(haircut)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={haircut.active === 1 ? "destructive" : "default"}
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: haircut.id,
                                active: haircut.active === 1 ? 0 : 1,
                              })
                            }
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setHaircutToDelete(haircut);
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
                Tem certeza que deseja deletar o corte <strong>{haircutToDelete?.name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (haircutToDelete) {
                    deleteMutation.mutate({ id: haircutToDelete.id });
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
