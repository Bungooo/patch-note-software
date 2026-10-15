import postgres from 'postgres'

// Chaîne de connexion lue depuis .env.local (jamais commitée)
const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL manquant : ajoute-le dans .env.local")

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1 // Idéal pour le développement local
})

export default sql
