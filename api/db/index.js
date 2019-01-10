import { Pool } from 'pg'
import dotenv from 'dotenv'
import 'babel-polyfill'

dotenv.config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

export default {
    query(text, params) {
        return new Promise((resolve, reject) => {
            pool.query(text, params)
            .then((res) => {
                resolve(res)
            })
            .catch((err) => {
                reject(err)
            })
        })
    },

    async transaction(callback) {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            try {
                await callback(client)
                client.query('COMMIT')
            } catch(error) {
                client.query('ROLLBACK')
            }
        } finally {
            client.release()
        }
    }, 
    
    pool
}
