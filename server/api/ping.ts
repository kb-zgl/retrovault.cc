export default defineEventHandler(() => {
  return { pong: true, time: Date.now() }
})
