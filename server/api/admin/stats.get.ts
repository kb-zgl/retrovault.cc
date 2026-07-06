import { requireAdmin } from '../../utils/admin'
import { sqlAll } from '../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [total] = await sqlAll(event, 'SELECT COUNT(*) as total FROM games')
  const [published] = await sqlAll(event, "SELECT COUNT(*) as total FROM games WHERE status = 'published'")
  const [draft] = await sqlAll(event, "SELECT COUNT(*) as total FROM games WHERE status = 'draft'")
  const [withZh] = await sqlAll(event, "SELECT COUNT(*) as total FROM games WHERE langs LIKE '%\"zh\"%'")
  return {
    total: total.total,
    published: published.total,
    draft: draft.total,
    withZh: withZh.total,
  }
})
