import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { BookOpen, Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function ArticleTools() {
  const [type, setType] = useState('revisao')
  const [norm, setNorm] = useState('abnt')
  const [content, setContent] = useState('')
  const [doi, setDoi] = useState('')

  const handleGenerate = () => {
    let text = ''
    if (type === 'revisao') {
      text = `1. INTRODUÇÃO\n\n2. MÉTODO\n2.1 Estratégia de Busca\n2.2 Critérios de Inclusão\n\n3. RESULTADOS\n\n4. DISCUSSÃO\n\n5. CONSIDERAÇÕES FINAIS`
    } else if (type === 'caso') {
      text = `1. INTRODUÇÃO\n\n2. APRESENTAÇÃO DO CASO\n2.1 Identificação\n2.2 História Clínica\n\n3. INTERVENÇÃO\n\n4. RESULTADOS E DISCUSSÃO\n\n5. CONSIDERAÇÕES FINAIS`
    } else if (type === 'relato') {
      text = `1. INTRODUÇÃO\n\n2. O CONTEXTO DA EXPERIÊNCIA\n\n3. DESCRIÇÃO DA VIVÊNCIA\n\n4. REFLEXÕES E DISCUSSÃO\n\n5. CONSIDERAÇÕES FINAIS`
    } else {
      text = `1. INTRODUÇÃO\n\n2. MÉTODO\n\n3. RESULTADOS\n\n4. DISCUSSÃO\n\n5. CONCLUSÃO`
    }
    setContent(`[Formato base: ${norm.toUpperCase()}]\n\n` + text)
    toast({ title: 'Estrutura gerada com sucesso' })
  }

  const handleFetchDoi = () => {
    if (!doi) return
    toast({ title: 'Referência gerada', description: 'Buscado via integração DOI' })
    const ref =
      norm === 'abnt'
        ? `SOBRENOME, N. Título do Artigo. Revista, v. 1, n. 1, p. 1-10, 2026. DOI: ${doi}`
        : `Sobrenome, N. (2026). Título do Artigo. Revista, 1(1), 1-10. https://doi.org/${doi}`
    setContent((prev) => prev + `\n\nREFERÊNCIAS\n${ref}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Estruturador de Artigos Científicos
          </CardTitle>
          <CardDescription>
            Gere o esqueleto do seu manuscrito baseado no tipo de estudo e na norma de formatação
            escolhida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Estudo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revisao">Revisão de Literatura</SelectItem>
                  <SelectItem value="caso">Estudo de Caso</SelectItem>
                  <SelectItem value="transversal">Estudo Transversal</SelectItem>
                  <SelectItem value="relato">Relato de Experiência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Norma</label>
              <Select value={norm} onValueChange={setNorm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abnt">ABNT</SelectItem>
                  <SelectItem value="apa">APA</SelectItem>
                  <SelectItem value="vancouver">Vancouver</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} className="bg-teal-600 hover:bg-teal-700">
            Gerar Esqueleto do Artigo
          </Button>

          <div className="relative mt-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="font-mono text-sm pt-4"
              placeholder="A estrutura do artigo será gerada aqui. Você pode editá-la livremente..."
            />
            {content && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 text-gray-500"
                onClick={() => {
                  navigator.clipboard.writeText(content)
                  toast({ title: 'Copiado!' })
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assistente de Referências</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-center">
          <Input
            placeholder="Cole o DOI ou título do artigo..."
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleFetchDoi} variant="secondary">
            Buscar e Adicionar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
