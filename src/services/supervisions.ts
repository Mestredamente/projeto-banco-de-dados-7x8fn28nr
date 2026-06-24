import pb from '@/lib/pocketbase/client'

export const createSupervision = (data: any) => pb.collection('supervisions').create(data)

export const updateSupervision = (id: string, data: any) =>
  pb.collection('supervisions').update(id, data)

export const getMySupervisions = () =>
  pb.collection('supervisions').getFullList({
    filter: `supervisor = '${pb.authStore.record?.id}' || supervised = '${pb.authStore.record?.id}'`,
    expand: 'supervisor,supervised',
  })

export const getSupervisionLogs = (supervisionId: string) =>
  pb.collection('supervision_logs').getFullList({
    filter: `supervision = '${supervisionId}'`,
    sort: '-date',
  })

export const createSupervisionLog = (data: any) => pb.collection('supervision_logs').create(data)

export const getSupervisionAgendaSummary = (supervisionId: string) =>
  pb.send(`/backend/v1/supervisions/${supervisionId}/summary`, { method: 'GET' })
