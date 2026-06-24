import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, Star } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export default function Academy() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])

  useEffect(() => {
    pb.collection('academy_courses')
      .getFullList({ filter: 'is_active = true', expand: 'instructor' })
      .then(setCourses)
      .catch(() => {})

    if (user?.id) {
      pb.collection('academy_enrollments')
        .getFullList({ filter: `user = '${user.id}'` })
        .then(setEnrollments)
        .catch(() => {})
    }
  }, [user?.id])

  const enrolledCourseIds = enrollments.map((e) => e.course)

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Syntra Academy</h1>
        <p className="text-gray-500 mt-1">Cursos, certificações e educação continuada.</p>
      </div>

      {enrollments.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Minhas Trilhas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((c) => enrolledCourseIds.includes(c.id))
              .map((course) => {
                const enrollment = enrollments.find((e) => e.course === course.id)
                return (
                  <Card
                    key={course.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 bg-gray-200 relative">
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {course.expand?.instructor?.name}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-4">
                        <span>{enrollment.progress || 0}% Concluído</span>
                        {enrollment.progress >= 100 && (
                          <span className="text-green-600 font-medium">Certificado Liberado</span>
                        )}
                      </div>
                      <Button className="w-full" asChild>
                        <Link to={`/academy/${course.id}`}>Continuar Assistindo</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Explorar Cursos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses
            .filter((c) => !enrolledCourseIds.includes(c.id))
            .map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gray-200">
                  {course.thumbnail_url && (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{course.level}</Badge>
                    <span className="font-bold text-lg">R$ {course.price?.toFixed(2)}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 flex-1 line-clamp-3 mb-4">
                    {course.description}
                  </p>
                  <Button className="w-full" variant="outline" asChild>
                    <Link to={`/academy/${course.id}`}>Ver Detalhes</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>
    </div>
  )
}
