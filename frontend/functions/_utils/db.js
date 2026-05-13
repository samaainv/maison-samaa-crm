export async function query(env, sql, params = []) {
  const { results } = await env.DB.prepare(sql).bind(...params).all()
  return results
}

export async function queryOne(env, sql, params = []) {
  return await env.DB.prepare(sql).bind(...params).first()
}

export async function execute(env, sql, params = []) {
  return await env.DB.prepare(sql).bind(...params).run()
}

export async function getLastInsertId(env) {
  const result = await queryOne(env, 'SELECT last_insert_rowid() as id')
  return result?.id
}
