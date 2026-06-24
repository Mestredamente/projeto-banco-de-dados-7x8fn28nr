import { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Search, Book, HelpCircle, Video, BookOpen, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'

export default function HelpManual() {
  const [searchTerm, setSearchTerm] = useState('')
  const [manualItems, setManualItems] = useState<any[]>([])

  useEffect(() => {
    pb.collection('system_manual')
      .getFullList({ sort: 'sort_order' })
      .then((res) => setManualItems(res))
      .catch(console.error)
  }, [])

  const filteredItems = manualItems.filter(
    (i) =>
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.content?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const faqs = filteredItems.filter((i) => i.type === 'faq')
  const glossary = filteredItems.filter((i) => i.type === 'glossary')
  const videos = filteredItems.filter((i) => i.type === 'video')

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <Book className="h-8 w-8 text-teal-600 dark:text-teal-400" /> Manual do Sistema
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Encontre respostas, tutoriais práticos e definições para dominar o Syntra.
        </p>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        <Input
          className="pl-12 h-12 text-base rounded-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm focus-visible:ring-teal-500"
          placeholder="Busque por 'Agendamento', 'Recibo', 'Prontuário'..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {videos.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Video className="h-6 w-6 text-purple-600" /> Tutoriais em Vídeo
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {videos.map((v) => (
              <Card
                key={v.id}
                className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-sm bg-white dark:bg-gray-900 ring-1 ring-gray-100 dark:ring-gray-800"
              >
                <div className="aspect-video relative bg-black">
                  <iframe
                    src={v.video_url}
                    className="w-full h-full"
                    title={v.title}
                    allowFullScreen
                  />
                </div>
                <CardHeader className="p-5">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <PlayCircle className="h-5 w-5 text-purple-500" /> {v.title}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-gray-500">
                    Duração estimada: {v.video_duration || 'Curto'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-10 mt-6">
        <section className="space-y-5">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <HelpCircle className="h-6 w-6 text-blue-600" /> Perguntas Frequentes (FAQ)
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 px-2"
          >
            {faqs.map((faq) => (
              <AccordionItem
                value={faq.id}
                key={faq.id}
                className="border-gray-100 dark:border-gray-800 px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                  {faq.title}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed pb-4 pt-1">
                  {faq.content}
                </AccordionContent>
              </AccordionItem>
            ))}
            {faqs.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Nenhuma pergunta encontrada com este termo.
              </div>
            )}
          </Accordion>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <BookOpen className="h-6 w-6 text-teal-600" /> Glossário Técnico
          </h2>
          <div className="grid gap-4">
            {glossary.map((g) => (
              <Card
                key={g.id}
                className="shadow-sm border-0 ring-1 ring-gray-100 dark:ring-gray-800 hover:ring-teal-500 transition-all"
              >
                <CardHeader className="py-4 px-5">
                  <CardTitle className="text-base text-teal-700 dark:text-teal-400 flex items-center gap-2 font-bold">
                    {g.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                    {g.content}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            {glossary.length === 0 && (
              <div className="p-6 text-center text-gray-500">Nenhum termo encontrado.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
