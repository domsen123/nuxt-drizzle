export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

/**
 * Converts database connection parameters into a PostgreSQL connection URI
 * @param config - Database configuration object
 * @returns PostgreSQL connection URI in the format: postgres://user:password@host:port/database
 */
export function buildDatabaseUri(config: DatabaseConfig): string {
  const { host, port, user, password, database } = config

  // URL encode the password to handle special characters
  const encodedPassword = encodeURIComponent(password)

  return `postgres://${user}:${encodedPassword}@${host}:${port}/${database}`
}
