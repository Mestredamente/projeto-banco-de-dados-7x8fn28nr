import pb from '@/lib/pocketbase/client'

export interface ProfileAuditLogEntry {
  id: string
  patient_id: string
  field_name: string
  old_value: string
  new_value: string
  changed_by: string
  ip_address: string
  created: string
  updated: string
}

export const getProfileAuditLogs = (patientId: string, page = 1, perPage = 10) =>
  pb.collection('profile_audit_log').getList<ProfileAuditLogEntry>(page, perPage, {
    filter: `patient_id="${patientId}"`,
    sort: '-created',
  })

export const getRecentProfileAuditLogs = (patientId: string, limit = 10) =>
  pb.collection('profile_audit_log').getList<ProfileAuditLogEntry>(1, limit, {
    filter: `patient_id="${patientId}"`,
    sort: '-created',
  })
