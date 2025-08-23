'use client'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/app/lib/supabaseClient'
import PartnerHubDemo from '../../components/partners/PartnerHubDemo'

export default function DashboardClient() {
  const [state, setState] = useState<{loading:boolean; userName?:string; companyName?:string; companyId?:string}>({loading:true})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      // find company_id
      const { data: cu } = await supabaseClient.from('company_users').select('company_id').eq('user_id', user.id).limit(1).maybeSingle()
      // fetch company name
      let companyName = 'Your Company', companyId = cu?.company_id as string | undefined
      if (companyId) {
        const { data: co } = await supabaseClient.from('companies').select('name').eq('id', companyId).maybeSingle()
        companyName = co?.name || companyName
      }
      if (mounted) setState({ loading:false, userName: user.user_metadata?.full_name || user.email!, companyName, companyId })
    })()
    return () => { mounted = false }
  }, [])

  if (state.loading) return <div className="p-8">Loading…</div>
  if (!state.companyId) return <div className="p-8">No company linked to your account yet.</div>

  return (
    <PartnerHubDemo
      userName={state.userName!}
      companyName={state.companyName!}
      toolName="Your Tool"
      companyId={state.companyId}
    />
  )
}
