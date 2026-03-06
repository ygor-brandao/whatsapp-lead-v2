"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserPlus, HelpCircle, UserX } from "lucide-react"

export function StatsBar() {
    const [stats, setStats] = useState({
        total: 0,
        buyers: 0,
        sellers: 0,
        uncertain: 0
    })

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase.from('Lead').select('classification')
            if (error) return

            let total = 0, buyers = 0, sellers = 0, uncertain = 0
            data.forEach(l => {
                total++
                if (l.classification === 'BUYER') buyers++
                if (l.classification === 'SELLER') sellers++
                if (l.classification === 'UNCERTAIN') uncertain++
            })

            setStats({ total, buyers, sellers, uncertain })
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchStats()
        const channel = supabase
            .channel('schema-db-changes-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Lead' }, () => fetchStats())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Analisado</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Compradores</p>
                        <p className="text-2xl font-bold text-green-600">{stats.buyers}</p>
                    </div>
                    <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <UserPlus className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Vendedores</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.sellers}</p>
                    </div>
                    <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                        <UserX className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Incerto/Outros</p>
                        <p className="text-2xl font-bold text-slate-600">{stats.uncertain}</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                        <HelpCircle className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
