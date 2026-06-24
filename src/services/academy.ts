import pb from '@/lib/pocketbase/client'

export const getAcademyCourses = () =>
  pb.collection('academy_courses').getFullList({ sort: '-created', expand: 'instructor' })

export const getMyEnrollments = () =>
  pb.collection('academy_enrollments').getFullList({
    filter: `user = '${pb.authStore.record?.id}'`,
    expand: 'course,course.instructor',
    sort: '-updated',
  })

export const enrollInCourse = (courseId: string) =>
  pb.collection('academy_enrollments').create({
    user: pb.authStore.record?.id,
    course: courseId,
    progress: 0,
  })

export const updateCourseProgress = (enrollmentId: string, progress: number) =>
  pb.collection('academy_enrollments').update(enrollmentId, { progress })

export const getCourseReviews = (courseId: string) =>
  pb.collection('academy_forum').getFullList({
    filter: `course = '${courseId}' && parent = ''`,
    expand: 'user',
    sort: '-created',
  })

export const postReview = (data: any) => pb.collection('academy_forum').create(data)
