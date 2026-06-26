import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Input } from '@/components/ui/input'
import { Search, BookOpen, HelpCircle, Video } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface ManualItem {
  id: string
  title: string
  content: string
  category: string
  type: string
  video_url: string
}

export default function HelpManual() {
  const [items, setItems] = useState<ManualItem[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    pb.collection('system_manual')
      .getFullList<ManualItem>({ sort: 'sort_order' })
      .then((data) => setItems(data))
      .catch(console.error)
  }, [])

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(search.toLowerCase())),
  )

  const faqs = filteredItems.filter((i) => i.type === 'faq')
  const videos = filteredItems.filter((i) => i.type === 'video')
  const glossary = filteredItems.filter((i) => i.type === 'glossary')

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 md:p-8 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Central de Ajuda Syntrapsi</h1>
          <p className="text-muted-foreground text-base">
            Encontre respostas, tutoriais e o glossário do sistema para aproveitar ao máximo a
            plataforma.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-9 bg-background h-11"
            placeholder="Buscar por dúvidas, termos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {videos.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b">
            <Video className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Tutoriais em Vídeo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-md transition-shadow duration-300 group border-border/60"
              >
                <CardHeader className="p-4 bg-muted/40 group-hover:bg-primary/5 transition-colors">
                  <CardTitle className="text-base leading-tight" title={video.title}>
                    {video.title.replace(/Syntra(?!\w)/g, 'Syntrapsi')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-video w-full bg-black/5">
                    {video.video_url ? (
                      <iframe
                        className="w-full h-full border-0"
                        src={video.video_url}
                        title={video.title}
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Video className="w-8 h-8 opacity-20" />
                        <span className="text-sm">Vídeo indisponível</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Perguntas Frequentes</h2>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-2 sm:p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors text-[15px]">
                      {faq.title.replace(/Syntra(?!\w)/g, 'Syntrapsi')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-[15px] bg-muted/20 p-4 rounded-md mt-2">
                      {faq.content.replace(/Syntra(?!\w)/g, 'Syntrapsi')}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      )}

      {glossary.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Glossário</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {glossary.map((term) => (
              <Card
                key={term.id}
                className="h-full hover:border-primary/50 transition-colors border-border/60 shadow-sm"
              >
                <CardHeader className="pb-2 pt-5">
                  <CardTitle className="text-[17px] text-primary">
                    {term.title.replace(/Syntra(?!\w)/g, 'Syntrapsi')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">
                    {term.content.replace(/Syntra(?!\w)/g, 'Syntrapsi')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {filteredItems.length === 0 && search.length > 0 && (
        <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-card">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-medium text-foreground mb-1">Nenhum resultado encontrado</p>
          <p className="text-sm">Não localizamos nenhum termo ou pergunta sobre "{search}".</p>
        </div>
      )}
    </div>
  )
}
