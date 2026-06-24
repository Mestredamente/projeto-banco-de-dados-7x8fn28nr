import pb from '@/lib/pocketbase/client'

export const createReferral = (data: any) => pb.collection('referrals').create(data)

export const updateReferral = (id: string, data: any) => pb.collection('referrals').update(id, data)

export const getSentReferrals = () =>
  pb.collection('referrals').getList(1, 50, {
    filter: `source = '${pb.authStore.record?.id}'`,
    sort: '-created',
    expand: 'patient,destination',
  })

export const getReceivedReferrals = () =>
  pb.collection('referrals').getList(1, 50, {
    filter: `destination = '${pb.authStore.record?.id}'`,
    sort: '-created',
    expand: 'patient,source',
  })

export const getPatientReferrals = (patientId: string) =>
  pb.collection('referrals').getFullList({
    filter: `patient = '${patientId}'`,
    sort: '-created',
    expand: 'source,destination',
  })
