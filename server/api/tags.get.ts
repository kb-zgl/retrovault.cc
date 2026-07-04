import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const tags = loadGameTags()
  return {
    total: tags.length,
    tags,
  }
})
