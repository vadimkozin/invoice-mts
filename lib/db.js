import mysql from 'mysql2/promise'

let connection = null

export async function db(name) {
  try {
    name = name.toUpperCase() // cust, tel, bill
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env[`DB_${name}_USER`],
      database: process.env[`DB_${name}_BASE`],
      password: process.env[`DB_${name}_PASS`],
    })
    return connection
  } catch (e) {
    if (e.code === 'ETIMEDOUT') {
      console.log('ERROR_DB_TIMEDOUT:: ', e.message)
    } else {
      throw new Error(e)
    }
  } finally {
    // await connection.end()
    console.log('.')
  }
}
