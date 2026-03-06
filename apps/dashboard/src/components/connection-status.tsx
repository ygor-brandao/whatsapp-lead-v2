"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ConnectionStatus } from "@/types/database.types"

export function ConnectionPill() {
    const [status, setStatus] = useState<ConnectionStatus | null>(null)

    const fetchStatus = async () => {
        const { data } = await supabase
            .from('ConnectionStatus')
            .select('*')
            .order('lastSeen', { ascending: false })
            .limit(1)
            .single()
        if (data) setStatus(data as ConnectionStatus)
    }

    useEffect(() => {
        fetchStatus()

        const channel = supabase
            .channel('schema-db-changes-conn')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ConnectionStatus' },
                () => fetchStatus()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const isOnline = status?.status === 'OPEN' || status?.status === 'CONNECTED'
    const isConnecting = status?.status === 'CONNECTING' || (status?.retryCount ?? 0) > 0

    return (
        <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-full shadow-sm">
            <span className="relative flex h-3 w-3">
                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                    }`}></span>
            </span>
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' :
                isConnecting ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                }`}>
                {isOnline ? 'Bot Online' : isConnecting ? 'Conectando...' : 'Bot Offline'}
            </span>
        </div>
    )
}
