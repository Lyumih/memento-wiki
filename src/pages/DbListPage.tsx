import { Card, Empty, Flex, Select, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import rawDb from '@/generated/db.json'
import type { WikiDb } from '@/types/wikiDb'

const db = rawDb as WikiDb

export type DbKind = 'items' | 'skills' | 'modifiers'

const routeSeg: Record<DbKind, string> = {
  items: 'items',
  skills: 'skills',
  modifiers: 'mods',
}

const titles: Record<DbKind, string> = {
  items: 'Предметы',
  skills: 'Умения',
  modifiers: 'Модификаторы',
}

export default function DbListPage({ kind }: { kind: DbKind }) {
  const rows = db[kind]
  const games = useMemo(
    () => [...new Set(rows.map((r) => r.game))].sort(),
    [rows],
  )
  const [game, setGame] = useState<string>('all')
  const filtered =
    game === 'all' ? rows : rows.filter((r) => r.game === game)
  const base = `/db/${routeSeg[kind]}`

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={2}>{titles[kind]}</Typography.Title>
      {kind === 'modifiers' ? (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Демо-каталог <strong>типов встроенных модификаторов</strong> слотов карты/умения/предмета (шансы
          двойного/тройного/крита, вампиризм, перезарядка, мана, эффективность, площадь, длительность). У
          каждого экземпляра свой уровень{' '}
          <Typography.Text code>Lm</Typography.Text> и те же пороги по{' '}
          <Typography.Text code>L</Typography.Text>, что в спеке. Подробности:{' '}
          <Link to="/dev/memento-modifiers">Моды на карте</Link>.
        </Typography.Paragraph>
      ) : null}
      <Select
        style={{ minWidth: 200 }}
        value={game}
        onChange={setGame}
        options={[
          { value: 'all', label: 'Все игры' },
          ...games.map((g) => ({ value: g, label: g })),
        ]}
      />
      <Card size="small">
        {filtered.length === 0 ? (
          <Empty description="Нет записей" />
        ) : (
          <Flex vertical gap="small">
            {filtered.map((item) => (
              <div key={item.id}>
                <Link to={`${base}/${item.id}`}>{item.name}</Link>
                <Typography.Text type="secondary"> — {item.summary}</Typography.Text>
              </div>
            ))}
          </Flex>
        )}
      </Card>
    </Space>
  )
}
