import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { BRAND } from '@/config/branding'
import { ImagePlus, Trash2 } from 'lucide-react'

export function VisualIdentityTab() {
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const records = await pb.collection('system_settings').getList(1, 1)
        if (records.items.length > 0) {
          const setting = records.items[0]
          setSettingsId(setting.id)
          if (setting.logo) {
            setLogoUrl(pb.files.getURL(setting, setting.logo))
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchSettings()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      if (selected.size > 2 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 2MB.',
          variant: 'destructive',
        })
        return
      }
      setFile(selected)
      setLogoUrl(URL.createObjectURL(selected))
    }
  }

  const handleSave = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      if (settingsId) {
        const updated = await pb.collection('system_settings').update(settingsId, formData)
        setLogoUrl(pb.files.getURL(updated, updated.logo))
      } else {
        const created = await pb.collection('system_settings').create(formData)
        setSettingsId(created.id)
        setLogoUrl(pb.files.getURL(created, created.logo))
      }
      toast({
        title: 'Sucesso',
        description: 'Logo atualizado com sucesso. Recarregue a página para aplicar as alterações.',
        variant: 'default',
      })
      setFile(null)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o logo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!settingsId) return
    setLoading(true)
    try {
      await pb.collection('system_settings').update(settingsId, { logo: null })
      setLogoUrl(null)
      setFile(null)
      toast({
        title: 'Sucesso',
        description: 'Logo removido com sucesso. Recarregue a página para aplicar as alterações.',
      })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o logo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Logo do Sistema</CardTitle>
          <CardDescription>
            Faça upload do logo do {BRAND.nome}. O logo será exibido no header, sidebar, tela de
            login e e-mails transacionais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1 w-full space-y-4">
              <Label>Selecionar novo logo (PNG, SVG, WebP - máx 2MB)</Label>
              <Input
                type="file"
                accept="image/png, image/svg+xml, image/webp"
                onChange={handleFileChange}
              />

              <div className="flex gap-4 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!file || loading}
                  className="bg-primary hover:bg-primary-hover text-white"
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Salvar Logo
                </Button>
                {logoUrl && (
                  <Button onClick={handleRemove} variant="destructive" disabled={loading}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover Logo
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full sm:w-[300px] h-[150px] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Preview"
                  className="max-w-[80%] max-h-[80%] object-contain"
                />
              ) : (
                <span className="text-gray-400 text-sm">Nenhum logo configurado</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
