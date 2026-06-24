import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ResearchDashboard from '@/components/research/ResearchDashboard'
import CaseReportWizard from '@/components/research/CaseReportWizard'
import StatisticalAnalysis from '@/components/research/StatisticalAnalysis'
import ArticleTools from '@/components/research/ArticleTools'
import IntegrationsTab from '@/components/research/IntegrationsTab'
import { Microscope } from 'lucide-react'

export default function Research() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in-up">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg dark:bg-blue-900/50 dark:text-blue-300">
          <Microscope className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pesquisa & Desenvolvimento
          </h1>
          <p className="text-gray-500 mt-1">
            Transforme dados clínicos anonimizados em produção científica e análises estatísticas.
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 bg-gray-100 dark:bg-gray-800 flex flex-wrap h-auto w-full justify-start gap-2 p-2">
          <TabsTrigger value="dashboard">Painel de Dados</TabsTrigger>
          <TabsTrigger value="case_report">Relato de Caso</TabsTrigger>
          <TabsTrigger value="stats">Estatística</TabsTrigger>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="integrations">Integrações (Lattes/ReBAP)</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <ResearchDashboard />
        </TabsContent>
        <TabsContent value="case_report" className="mt-0">
          <CaseReportWizard />
        </TabsContent>
        <TabsContent value="stats" className="mt-0">
          <StatisticalAnalysis />
        </TabsContent>
        <TabsContent value="articles" className="mt-0">
          <ArticleTools />
        </TabsContent>
        <TabsContent value="integrations" className="mt-0">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
