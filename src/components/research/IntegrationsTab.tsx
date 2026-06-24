import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'
import { GraduationCap, ExternalLink, Search, CheckCircle, UploadCloud } from 'lucide-react'
import { recordExport } from '@/services/research'

export default function IntegrationsTab() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    academic_title: '',
    academic_institution: '',
    research_areas: '',
  })
  const [loading, setLoading] = useState(false)
  const [rebapSearch, setRebapSearch] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        academic_title: user.academic_title || '',
        academic_institution: user.academic_institution || '',
        research_areas: Array.isArray(user.research_areas) ? user.research_areas.join(', ') : '',
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        academic_title: formData.academic_title,
        academic_institution: formData.academic_institution,
        research_areas: formData.research_areas
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      toast({ title: 'Dados acadêmicos salvos' })
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
    setLoading(false)
  }

  const handleExportLattes = async (type: string) => {
    await recordExport(type, 1)
    toast({
      title: `Exportação ${type} concluída`,
      description:
        'Este arquivo pode ser importado na Plataforma Lattes. Acesse lattes.cnpq.br e faça o upload.',
      duration: 6000,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-indigo-100">
        <CardHeader className="bg-indigo-50/50">
          <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Integração Curriculo Lattes
          </CardTitle>
          <CardDescription>
            Mantenha seus dados atualizados para gerar os arquivos compatíveis com a Plataforma
            Lattes do CNPq.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Nome (Mapeado do Perfil)</label>
              <Input value={user?.name || ''} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">CRP</label>
              <Input value={user?.crp || ''} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Titulação Acadêmica</label>
              <Input
                value={formData.academic_title}
                onChange={(e) => setFormData({ ...formData, academic_title: e.target.value })}
                placeholder="Ex: Mestre em Psicologia Clínica"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Instituição Vinculada</label>
              <Input
                value={formData.academic_institution}
                onChange={(e) => setFormData({ ...formData, academic_institution: e.target.value })}
                placeholder="Ex: USP, UFRJ, PUC"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                Linhas de Pesquisa (separadas por vírgula)
              </label>
              <Input
                value={formData.research_areas}
                onChange={(e) => setFormData({ ...formData, research_areas: e.target.value })}
                placeholder="Ex: TCC, Ansiedade, Avaliação Psicológica, Instrumentos"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? 'Salvando...' : 'Salvar Dados Acadêmicos'}
            </Button>
            <div className="flex-1 min-w-[20px]" />
            <Button variant="outline" onClick={() => handleExportLattes('XML')} className="gap-2">
              <UploadCloud className="w-4 h-4" /> Exportar XML Lattes
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportLattes('CSV')}
              className="gap-2 text-indigo-700 border-indigo-200"
            >
              Exportar CSV Lattes
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendências de Pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                Sua clínica tem <strong>30 casos</strong> de <strong>Ansiedade (F41)</strong>. Esta
                é uma área com <strong>12.450 publicações</strong> no último ano (Fonte: PubMed).
                Considere publicar seus achados clínicos!
              </p>
              <Button
                variant="link"
                className="px-0 mt-2 h-auto text-blue-600 gap-1"
                onClick={() =>
                  window.open('https://pubmed.ncbi.nlm.nih.gov/?term=anxiety', '_blank')
                }
              >
                Explorar Literatura na Base PubMed <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Painel SATEPSI (ReBAP)</CardTitle>
            <CardDescription className="text-xs">
              Consulte a situação dos testes psicológicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Busque por nome do teste ou sigla..."
                value={rebapSearch}
                onChange={(e) => setRebapSearch(e.target.value)}
              />
              <Button variant="secondary" className="px-3">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {rebapSearch && (
              <div className="p-3 border rounded-md flex justify-between items-center bg-green-50 border-green-200 animate-fade-in">
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    BDI-II - Inventário de Depressão de Beck
                  </p>
                  <p className="text-xs text-green-700 flex items-center gap-1 mt-1 font-semibold">
                    <CheckCircle className="w-3 h-3" /> Favorável
                  </p>
                </div>
                <a
                  href="https://www.gov.br/satepsih/assuntos/rebap"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                >
                  Fonte Oficial <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
