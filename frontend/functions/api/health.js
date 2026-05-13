import { json } from '../_utils/response.js'

export function onRequest() {
  return json({ status: 'ok' })
}
