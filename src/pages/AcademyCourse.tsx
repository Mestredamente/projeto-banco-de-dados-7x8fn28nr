import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayCircle, CheckCircle, Award, ArrowLeft } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export default function AcademyCourse() {
  const { id } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [activeModule, setActiveModule] = useState<any>(null)

  const loadData = async () => {
    try {
      const c = await pb.collection('academy_courses').getOne(id!, { expand: 'instructor' })
      setCourse(c)
      if (c.modules && c.modules.length > 0) setActiveModule(c.modules[0])

      if (user?.id) {
        const enrolls = await pb
          .collection('academy_enrollments')
          .getList(1, 1, { filter: `course='${c.id}' && user='${user.id}'` })
        if (enrolls.items.length > 0) setEnrollment(enrolls.items[0])
      }
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [id, user?.id])

  const enroll = async () => {
    try {
      const e = await pb.collection('academy_enrollments').create({
        course: course.id,
        user: user?.id,
        progress: 0,
      })
      setEnrollment(e)
      toast({ title: 'Matrícula realizada com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao matricular', variant: 'destructive' })
    }
  }

  const markModuleCompleted = async () => {
    if (!enrollment) return
    try {
      // Mock logic: add roughly equal progress per module
      const increment = 100 / (course.modules?.length || 1)
      const newProgress = Math.min(100, Math.round((enrollment.progress || 0) + increment))

      const updated = await pb.collection('academy_enrollments').update(enrollment.id, {
        progress: newProgress,
      })
      setEnrollment(updated)
      toast({ title: 'Progresso salvo!' })
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  if (!course) return <div className="p-8">Carregando...</div>

  return (
    <div className="animate-fade-in pb-12">
      <div className="bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="text-gray-300 hover:text-white mb-6 -ml-4" asChild>
            <Link to="/academy">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Link>
          </Button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {enrollment ? (
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-gray-800">
                  <video
                    src={activeModule?.videoUrl}
                    controls
                    className="w-full h-full rounded-lg"
                    poster={course.thumbnail_url}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center flex-col">
                  <PlayCircle className="w-16 h-16 text-gray-500 mb-4" />
                  <p className="text-gray-400">Matricule-se para assistir</p>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-gray-400 mb-6">Por {course.expand?.instructor?.name}</p>

              {!enrollment ? (
                <Card className="bg-gray-800 border-gray-700 text-white">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold mb-6">R$ {course.price?.toFixed(2)}</div>
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      size="lg"
                      onClick={enroll}
                    >
                      Matricular-se Agora
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-4">
                      Acesso imediato ao conteúdo
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-800 border-gray-700 text-white">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Seu Progresso</h3>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">
                      {enrollment.progress || 0}% Concluído
                    </p>

                    {enrollment.progress >= 100 && (
                      <div className="bg-green-900/30 border border-green-800 text-green-400 p-4 rounded-md mb-6 flex flex-col items-center">
                        <Award className="w-8 h-8 mb-2" />
                        <span className="font-bold text-center block mb-2">Curso Concluído!</span>
                        {enrollment.certificate_hash && (
                          <div className="text-xs text-center">
                            Código do Certificado:
                            <br />
                            <span className="font-mono text-white">
                              {enrollment.certificate_hash}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full text-white border-gray-600 hover:bg-gray-700"
                      onClick={markModuleCompleted}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Marcar módulo como visto
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <Tabs defaultValue="modulos" className="w-full">
          <TabsList>
            <TabsTrigger value="modulos">Módulos</TabsTrigger>
            <TabsTrigger value="sobre">Sobre o Curso</TabsTrigger>
            <TabsTrigger value="forum">Fórum</TabsTrigger>
          </TabsList>

          <TabsContent value="modulos" className="mt-6">
            <div className="space-y-2">
              {course.modules?.map((m: any, i: number) => (
                <button
                  key={i}
                  className={`w-full text-left p-4 rounded-md border flex items-center justify-between transition-colors ${activeModule?.title === m.title ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => enrollment && setActiveModule(m)}
                  disabled={!enrollment}
                >
                  <div className="flex items-center">
                    <PlayCircle
                      className={`w-5 h-5 mr-3 ${activeModule?.title === m.title ? 'text-teal-600' : 'text-gray-400'}`}
                    />
                    <span className="font-medium">{m.title}</span>
                  </div>
                  <span className="text-sm text-gray-500">{m.duration} min</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="sobre"
            className="mt-6 text-gray-700 leading-relaxed whitespace-pre-wrap"
          >
            {course.description}
          </TabsContent>

          <TabsContent value="forum" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Fórum de discussões estará disponível em breve.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
