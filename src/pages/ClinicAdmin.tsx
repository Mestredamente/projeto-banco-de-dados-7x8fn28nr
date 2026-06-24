import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfessionalsTab from './ClinicAdmin/ProfessionalsTab'
import PermissionsTab from './ClinicAdmin/PermissionsTab'
import RoomsTab from './ClinicAdmin/RoomsTab'
import InventoryTab from './ClinicAdmin/InventoryTab'
import VacationsTab from './ClinicAdmin/VacationsTab'

export default function ClinicAdmin() {
  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão da Clínica</h1>
        <p className="text-muted-foreground mt-1">
          Administração centralizada de profissionais, salas, estoque e permissões.
        </p>
      </div>
      <Tabs defaultValue="profissionais" className="w-full mt-6">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-2 bg-muted/50 p-2">
          <TabsTrigger value="profissionais" className="data-[state=active]:bg-background">
            Profissionais
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="data-[state=active]:bg-background">
            Permissões
          </TabsTrigger>
          <TabsTrigger value="salas" className="data-[state=active]:bg-background">
            Salas e Mapas
          </TabsTrigger>
          <TabsTrigger value="estoque" className="data-[state=active]:bg-background">
            Estoque (IA)
          </TabsTrigger>
          <TabsTrigger value="ferias" className="data-[state=active]:bg-background">
            Férias
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profissionais" className="mt-4">
          <ProfessionalsTab />
        </TabsContent>
        <TabsContent value="permissoes" className="mt-4">
          <PermissionsTab />
        </TabsContent>
        <TabsContent value="salas" className="mt-4">
          <RoomsTab />
        </TabsContent>
        <TabsContent value="estoque" className="mt-4">
          <InventoryTab />
        </TabsContent>
        <TabsContent value="ferias" className="mt-4">
          <VacationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
