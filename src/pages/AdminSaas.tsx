import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardTab } from '@/components/admin-saas/DashboardTab'
import { SubscribersTab } from '@/components/admin-saas/SubscribersTab'
import { PlansTab } from '@/components/admin-saas/PlansTab'
import { RetentionTab } from '@/components/admin-saas/RetentionTab'
import { CouponsTab } from '@/components/admin-saas/CouponsTab'
import { FinancialTab } from '@/components/admin-saas/FinancialTab'
import { AnalyticsTab } from '@/components/admin-saas/AnalyticsTab'
import { AuditTab } from '@/components/admin-saas/AuditTab'
import { HealthCheckTab } from '@/components/admin-saas/HealthCheckTab'

export default function AdminSaas() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Portal do Gestor do SaaS</h1>
      </div>
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="subscribers">Assinantes</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="retention">Retenção</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="health">Health Check</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="subscribers" className="space-y-4">
          <SubscribersTab />
        </TabsContent>
        <TabsContent value="plans" className="space-y-4">
          <PlansTab />
        </TabsContent>
        <TabsContent value="retention" className="space-y-4">
          <RetentionTab />
        </TabsContent>
        <TabsContent value="coupons" className="space-y-4">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="financial" className="space-y-4">
          <FinancialTab />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
          <AuditTab />
        </TabsContent>
        <TabsContent value="health" className="space-y-4">
          <HealthCheckTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
