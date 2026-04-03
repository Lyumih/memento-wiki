import { Space, Typography } from 'antd'
import rehypeSlug from 'rehype-slug'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import wikiMd from '../generated/memento-wiki-export.md?raw'

const MD_HREF = '/memento-wiki-export.md'
const JSON_HREF = '/memento-db.json'

export default function WikiExportPage() {
  const rehypePlugins = useMemo(() => [rehypeSlug], [])

  return (
    <div>
      <Typography.Title level={2}>Экспорт вики</Typography.Title>
      <Typography.Paragraph>
        Один файл со всеми статьями (Markdown) и полный снимок каталога БД (JSON). Удобно для ИИ,
        архива и предпросмотра в IDE.
      </Typography.Paragraph>
      <Space wrap size="middle" style={{ marginBottom: 24 }}>
        <Typography.Link href={MD_HREF} download="memento-wiki-export.md" strong>
          Скачать memento-wiki-export.md
        </Typography.Link>
        <Typography.Link href={JSON_HREF} download="memento-db.json" strong>
          Скачать memento-db.json
        </Typography.Link>
      </Space>
      <Typography.Title level={4}>Предпросмотр</Typography.Title>
      <article
        className="wiki-export-preview"
        style={{
          border: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
          borderRadius: 8,
          padding: 16,
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins}>
          {wikiMd}
        </ReactMarkdown>
      </article>
    </div>
  )
}
