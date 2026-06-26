import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompanyDataTab } from '@/components/admin-saas/settings/CompanyDataTab'
import { FiscalSettingsTab } from '@/components/admin-saas/settings/FiscalSettingsTab'
import { TransactionalEmailTab } from '@/components/admin-saas/settings/TransactionalEmailTab'
import { TermsPrivacyTab } from '@/components/admin-saas/settings/TermsPrivacyTab'
import { MaintenanceTab } from '@/components/admin-saas/settings/MaintenanceTab'
import { VisualIdentityTab } from '@/components/admin-saas/VisualIdentityTab'

export default function SaasSettings() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 w-full animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="fiscal">Configurações Fiscais</TabsTrigger>
          <TabsTrigger value="email">Email Transacional</TabsTrigger>
          <TabsTrigger value="terms">Termos e Privacidade</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="visual">Identidade Visual</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanyDataTab />
        </TabsContent>
        <TabsContent value="fiscal">
          <FiscalSettingsTab />
        </TabsContent>
        <TabsContent value="email">
          <TransactionalEmailTab />
        </TabsContent>
        <TabsContent value="terms">
          <TermsPrivacyTab />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceTab />
        </TabsContent>
        <TabsContent value="visual">
          <VisualIdentityTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
