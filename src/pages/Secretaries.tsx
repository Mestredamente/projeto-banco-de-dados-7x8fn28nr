import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SecretariesList from '@/components/secretaries/SecretariesList'
import TimeTrackingAdmin from '@/components/secretaries/TimeTrackingAdmin'
import HrReports from '@/components/secretaries/HrReports'
import VacationsTab from '@/pages/ClinicAdmin/VacationsTab'

export default function Secretaries() {
  const [activeTab, setActiveTab] = useState('lista')

  return (
    <div className="p-2 md:p-6 w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipe e RH</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas secretárias, permissões, ponto eletrônico e férias.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-2 bg-muted/50 p-2">
          <TabsTrigger value="lista" className="data-[state=active]:bg-background">
            Secretárias
          </TabsTrigger>
          <TabsTrigger value="ponto" className="data-[state=active]:bg-background">
            Ponto e Frequência
          </TabsTrigger>
          <TabsTrigger value="ferias" className="data-[state=active]:bg-background">
            Férias
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="data-[state=active]:bg-background">
            Relatórios de RH
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-0">
          <SecretariesList />
        </TabsContent>
        <TabsContent value="ponto" className="mt-0">
          <TimeTrackingAdmin />
        </TabsContent>
        <TabsContent value="ferias" className="mt-0 bg-card p-4 rounded-xl border">
          <VacationsTab />
        </TabsContent>
        <TabsContent value="relatorios" className="mt-0">
          <HrReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
