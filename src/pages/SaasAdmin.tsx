import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardTab } from '@/components/saas/DashboardTab'
import { SubscribersTab } from '@/components/saas/SubscribersTab'
import { PlansTab } from '@/components/saas/PlansTab'
import { CouponsTab } from '@/components/saas/CouponsTab'
import { FinancialTab } from '@/components/saas/FinancialTab'
import { AnalyticsTab } from '@/components/saas/AnalyticsTab'
import { AuditTab } from '@/components/saas/AuditTab'
import { HealthCheckTab } from '@/components/saas/HealthCheckTab'

export default function SaasAdmin() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Gestão Syntra (SaaS)
        </h1>
        <p className="text-gray-500 mt-1">
          Painel centralizado de administração e monitoramento do ecossistema.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex flex-wrap gap-2 justify-start h-auto p-1 bg-transparent border-b rounded-none mb-4">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="subscribers"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Assinantes
          </TabsTrigger>
          <TabsTrigger
            value="plans"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Planos
          </TabsTrigger>
          <TabsTrigger
            value="coupons"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Cupons
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Financeiro
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Auditoria
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
          >
            Health Check
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="subscribers">
            <SubscribersTab />
          </TabsContent>
          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>
          <TabsContent value="coupons">
            <CouponsTab />
          </TabsContent>
          <TabsContent value="financial">
            <FinancialTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
          <TabsContent value="health">
            <HealthCheckTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
