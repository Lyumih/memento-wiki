import { Card, Typography } from 'antd'
import { Navigate, useParams } from 'react-router-dom'
import rawDb from '@/generated/db.json'
import type { WikiDb } from '@/types/wikiDb'

const db = rawDb as WikiDb
import type { DbKind } from './DbListPage'

const routeSeg: Record<DbKind, string> = {
  items: 'items',
  skills: 'skills',
  modifiers: 'mods',
}

export default function DbDetailPage({ kind }: { kind: DbKind }) {
  const { id } = useParams<{ id: string }>()
  if (!id) return <Navigate to={`/db/${routeSeg[kind]}`} replace />

  const row = db[kind].find((x) => x.id === id)
  if (!row) return <Navigate to={`/db/${routeSeg[kind]}`} replace />

  return (
    <Card>
      <Typography.Title level={2}>{row.name}</Typography.Title>
      <Typography.Paragraph type="secondary">
        Игра: {row.game} · Тип: {row.type}
      </Typography.Paragraph>
      <Typography.Paragraph>{row.summary}</Typography.Paragraph>
      {row.body ? (
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {row.body}
        </Typography.Paragraph>
      ) : null}
    </Card>
  )
}
