import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UpcomingSessions } from '@/components/telepsicologia/UpcomingSessions'
import { FixedRoomSettings } from '@/components/telepsicologia/FixedRoomSettings'
import { TermsList } from '@/components/telepsicologia/TermsList'
import { DocumentsList } from '@/components/telepsicologia/DocumentsList'
import { LayoutDashboard, Settings, FileSignature, FileUp } from 'lucide-react'

export default function Telepsicologia() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">🖥️ Telepsicologia</h1>
        <p className="text-muted-foreground">
          Central de gestão de sessões remotas, links, consentimentos e documentos.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Próximas Sessões
          </TabsTrigger>
          <TabsTrigger value="room" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Sala Fixa
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileSignature className="w-4 h-4" /> Consentimentos
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileUp className="w-4 h-4" /> Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <UpcomingSessions />
        </TabsContent>
        <TabsContent value="room">
          <FixedRoomSettings />
        </TabsContent>
        <TabsContent value="terms">
          <TermsList />
        </TabsContent>
        <TabsContent value="docs">
          <DocumentsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
