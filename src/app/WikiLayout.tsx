import {
  Layout,
  Menu,
  Spin,
  theme,
} from 'antd'
import type { MenuProps } from 'antd'
import { Suspense, useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import rawNav from '../generated/nav.json'
import type { WikiNav } from '@/types/wikiNav'

const nav = rawNav as WikiNav

const { Header, Content } = Layout

function buildMenuItems(navData: WikiNav): MenuProps['items'] {
  const items: MenuProps['items'] = []
  const seen = new Set<string>()

  const push = (path: string, title: string) => {
    if (seen.has(path)) return
    seen.add(path)
    items.push({ key: path, label: title })
  }

  const homePath = navData.home?.path ?? '/'
  if (navData.home) {
    seen.add(homePath)
  }
  for (const p of navData.players) {
    push(p.path, p.title)
  }
  for (const p of navData.dev) {
    push(p.path, p.title)
  }
  for (const d of navData.db) {
    push(d.path, d.title)
  }
  for (const p of navData.games) {
    push(p.path, p.title)
  }
  return items
}

export default function WikiLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const menuItems = useMemo(() => buildMenuItems(nav), [])

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(String(key))
  }

  const selected = location.pathname.replace(/\/$/, '') || '/'
  const homePath = nav.home?.path ?? '/'
  const menuSelectedKeys = selected === homePath ? [] : [selected]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingInline: 24,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            width: '100%',
            maxWidth: 960,
            minWidth: 0,
            marginInline: 'auto',
          }}
        >
          <Link
            to={homePath}
            style={{
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Memento
          </Link>
          <div
            style={{
              flex: '1 1 0',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Menu
              mode="horizontal"
              selectedKeys={menuSelectedKeys}
              items={menuItems}
              onClick={onMenuClick}
              style={{
                borderBottom: 'none',
                width: '100%',
                minWidth: 0,
              }}
            />
          </div>
        </div>
      </Header>
      <Content style={{ padding: 24, maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Suspense fallback={<Spin size="large" />}>
          <Outlet />
        </Suspense>
      </Content>
    </Layout>
  )
}
