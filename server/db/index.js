const { Pool } = require("pg")

//DB Connection
const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  templateQuery: (text) => pool.query(text),
}
