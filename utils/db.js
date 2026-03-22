import mysql from 'mysql2'
import dotenv from 'dotenv'
dotenv.config()

const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'employeems'
})

conn.connect(function(err) {
    if(err) {
        console.log("Connection error: " + err.message)
    } else {
        console.log("Connected")
    }
})

export default conn;