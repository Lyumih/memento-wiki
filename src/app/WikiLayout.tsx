import {
  Layout,
  Menu,
  Spin,
  theme,
} from 'antd'
import type { MenuProps } from 'antd'
import { Suspense, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import rawNav from '../generated/nav.json'
import type { WikiNav } from '@/types/wikiNav'

const nav = rawNav as WikiNav

const { Header, Sider, Content } = Layout

function buildMenuItems(navData: WikiNav): MenuProps['items'] {
  const items: MenuProps['items'] = []
  if (navData.home) {
    items.push({ key: navData.home.path, label: navData.home.title })
  }
  if (navData.players.length > 0) {
    items.push({
      key: 'players',
      label: 'Для игроков',
      children: navData.players.map((p) => ({
        key: p.path,
        label: p.title,
      })),
    })
  }
  if (navData.dev.length > 0) {
    items.push({
      key: 'dev',
      label: 'Для разработчиков',
      children: navData.dev.map((p) => ({
        key: p.path,
        label: p.title,
      })),
    })
  }
  items.push({
    key: 'db',
    label: 'База данных',
    children: navData.db.map((d) => ({
      key: d.path,
      label: d.title,
    })),
  })
  if (navData.games.length > 0) {
    items.push({
      key: 'games',
      label: 'Примеры в играх',
      children: navData.games.map((p) => ({
        key: p.path,
        label: p.title,
      })),
    })
  }
  return items
}

export default function WikiLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const menuItems = useMemo(() => buildMenuItems(nav), [])

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const selected = location.pathname.replace(/\/$/, '') || '/'
  const openKeys = useMemo(
    () => ['players', 'dev', 'db', 'games'],
    [],
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" breakpoint="lg" collapsible width={268}>
        <div
          style={{
            padding: 16,
            fontWeight: 600,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          Memento Mori
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={onMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            paddingInline: 24,
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <span style={{ fontWeight: 600 }}>Memento Mori — вики</span>
        </Header>
        <Content style={{ padding: 24, maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <Suspense fallback={<Spin size="large" />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}
