import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Scissors, Users, Calendar, History, Sparkles } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Users,
      title: "Barbeiros",
      description: "Cadastre e gerencie os barbeiros da sua equipe",
      href: "/barbeiros",
      color: "text-blue-500",
    },
    {
      icon: Scissors,
      title: "Tipos de Cortes",
      description: "Cadastre os serviços e valores oferecidos",
      href: "/cortes",
      color: "text-purple-500",
    },
    {
      icon: Calendar,
      title: "Registrar Atendimento",
      description: "Registre novos atendimentos realizados",
      href: "/atendimentos",
      color: "text-green-500",
    },
    {
      icon: BarChart3,
      title: "Dashboard",
      description: "Visualize estatísticas e desempenho",
      href: "/dashboard",
      color: "text-orange-500",
    },
    {
      icon: History,
      title: "Histórico",
      description: "Consulte o histórico completo de atendimentos",
      href: "/historico",
      color: "text-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Scissors className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Barbearia Criatech</h1>
              <p className="text-sm text-muted-foreground">Sistema de Gerenciamento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Sistema Completo de Gestão</span>
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-4">
            Gerencie sua barbearia com{" "}
            <span className="text-primary">elegância</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Controle completo de barbeiros, serviços, atendimentos e estatísticas em uma interface moderna e intuitiva
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full group">
                    Acessar
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-foreground">
            Recursos do Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-primary">100%</CardTitle>
                <CardDescription>Automático</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Todos os dados são salvos automaticamente no banco de dados
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-primary">Real-time</CardTitle>
                <CardDescription>Estatísticas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dashboards com métricas diárias e mensais atualizadas
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-primary">Filtros</CardTitle>
                <CardDescription>Avançados</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Histórico completo com filtros por data, barbeiro e serviço
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 bg-background/80 backdrop-blur-sm mt-20">
        <div className="container py-8">
          <p className="text-center text-sm text-muted-foreground">
            Desenvolvido por <span className="font-semibold text-primary">Criatech</span> • Sistema de Gerenciamento de Barbearia
          </p>
        </div>
      </div>
    </div>
  );
}
