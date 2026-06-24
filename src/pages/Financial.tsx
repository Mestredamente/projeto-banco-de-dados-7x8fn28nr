import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialDashboard } from '@/components/financial/FinancialDashboard'
import { FinancialRecords } from '@/components/financial/FinancialRecords'
import { FinancialReconciliation } from '@/components/financial/FinancialReconciliation'
import { FinancialReports } from '@/components/financial/FinancialReports'
import { BillingNotifications } from '@/components/financial/BillingNotifications'
import { AgreementsPackages } from '@/components/financial/AgreementsPackages'

export default function Financial() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Gestão de cobranças, recebimentos, conciliação e relatórios.
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <TabsList className="flex w-max min-w-full h-auto gap-2 justify-start bg-transparent p-0">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/30 rounded-full px-4 py-2 border border-transparent data-[state=active]:border-teal-200"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="records"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/30 rounded-full px-4 py-2 border border-transparent data-[state=active]:border-teal-200"
            >
              Lançamentos
            </TabsTrigger>
            <TabsTrigger
              value="agreements"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/30 rounded-full px-4 py-2 border border-transparent data-[state=active]:border-teal-200"
            >
              Acordos & Pacotes
            </TabsTrigger>
            <TabsTrigger
              value="reconciliation"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/30 rounded-full px-4 py-2 border border-transparent data-[state=active]:border-teal-200"
            >
              Conciliação
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/30 rounded-full px-4 py-2 border border-transparent data-[state=active]:border-teal-200"
            >
              Relatórios
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/30 rounded-full px-4 py-2 border border-transparent data-[state=active]:border-teal-200"
            >
              Aprovações
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-6">
          <FinancialDashboard />
        </TabsContent>
        <TabsContent value="records" className="mt-6">
          <FinancialRecords />
        </TabsContent>
        <TabsContent value="agreements" className="mt-6">
          <AgreementsPackages />
        </TabsContent>
        <TabsContent value="reconciliation" className="mt-6">
          <FinancialReconciliation />
        </TabsContent>
        <TabsContent value="reports" className="mt-6">
          <FinancialReports />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <BillingNotifications />
        </TabsContent>
      </Tabs>
    </div>
  )
}
