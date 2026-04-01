import { useMemo, useState } from 'react'
import { Card, Slider, Typography } from 'antd'
import { Navigate, Link, useParams } from 'react-router-dom'
import rawDb from '@/generated/db.json'
import type { DbEntity, WikiDb } from '@/types/wikiDb'
import { LEVEL_MAX, LEVEL_MIN } from '@/constants/dbLevel'
import { entityHasUsableStats, interpolateDbText } from '@/lib/dbEntityLevelText'

const db = rawDb as WikiDb
import type { DbKind } from './DbListPage'

const routeSeg: Record<DbKind, string> = {
  items: 'items',
  skills: 'skills',
  modifiers: 'mods',
}

function DbDetailCard({
  kind,
  row,
}: {
  kind: DbKind
  row: DbEntity
}) {
  const [level, setLevel] = useState(LEVEL_MIN)

  const hasStats = entityHasUsableStats(row.stats)
  const summaryRendered = useMemo(
    () => interpolateDbText(row.summary, row.stats, level),
    [row.summary, row.stats, level],
  )
  const bodyRendered = useMemo(
    () =>
      row.body ? interpolateDbText(row.body, row.stats, level) : undefined,
    [row.body, row.stats, level],
  )

  return (
    <Card>
      <Typography.Title level={2}>{row.name}</Typography.Title>
      {kind === 'modifiers' ? (
        <Typography.Paragraph type="secondary">
          Архетип модификатора слота (демо-каталог вики). Полное описание механики{' '}
          <Typography.Text code>L</Typography.Text> /{' '}
          <Typography.Text code>Lm</Typography.Text> и слотов —{' '}
          <Link to="/dev/memento-modifiers">Моды на карте</Link>.
        </Typography.Paragraph>
      ) : null}
      <Typography.Paragraph type="secondary">
        Игра: {row.game} · Тип: {row.type}
      </Typography.Paragraph>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong>Уровень: {level}</Typography.Text>
        <Slider
          min={LEVEL_MIN}
          max={LEVEL_MAX}
          step={1}
          value={level}
          onChange={setLevel}
          disabled={!hasStats}
          style={{ marginTop: 8 }}
          aria-valuemin={LEVEL_MIN}
          aria-valuemax={LEVEL_MAX}
          aria-valuenow={level}
        />
        {!hasStats ? (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Для этой записи уровень не влияет на описание.
          </Typography.Paragraph>
        ) : null}
      </div>
      <Typography.Paragraph>{summaryRendered}</Typography.Paragraph>
      {bodyRendered !== undefined ? (
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {bodyRendered}
        </Typography.Paragraph>
      ) : null}
    </Card>
  )
}

export default function DbDetailPage({ kind }: { kind: DbKind }) {
  const { id } = useParams<{ id: string }>()
  if (!id) return <Navigate to={`/db/${routeSeg[kind]}`} replace />

  const row = db[kind].find((x) => x.id === id)
  if (!row) return <Navigate to={`/db/${routeSeg[kind]}`} replace />

  return <DbDetailCard key={id} kind={kind} row={row} />
}
