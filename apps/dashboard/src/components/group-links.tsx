"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, ExternalLink, Link2Off } from "lucide-react"

export function GroupLinksView() {
    const [links, setLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLinks = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('GroupLink')
                .select('*')
                .order('discoveredAt', { ascending: false })
                .limit(100)

            if (error) throw error
            if (data) setLinks(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLinks()
        const channel = supabase
            .channel('schema-db-changes-links')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'GroupLink' }, () => fetchLinks())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Link className="h-5 w-5" /> Links de Grupos
                </CardTitle>
                <CardDescription>
                    Grupos do WhatsApp descobertos automaticamente através de mensagens dos leads.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading && links.length === 0 ? (
                    <div className="flex justify-center p-8 text-muted-foreground">Carregando links...</div>
                ) : links.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
                        <Link2Off className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Nenhum link encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Os links serão extraídos e salvos aqui automaticamente quando enviados em grupos.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {links.map((link) => (
                            <div key={link.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card text-sm gap-4">
                                <div className="space-y-1">
                                    <a href={link.link} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline flex items-center">
                                        {link.link} <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                    <p className="text-xs text-muted-foreground">Extraído em: {formatDistanceToNow(new Date(link.discoveredAt), { addSuffix: true, locale: ptBR })}</p>
                                </div>
                                <div className="bg-muted p-2 rounded text-xs italic max-w-sm truncate" title={link.messageText}>
                                    "{link.messageText}"
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
