import postgres from 'postgres'

// Ta chaîne de connexion directe
const connectionString = "postgresql://neondb_owner:npg_uNwg9ntBih5G@ep-calm-dew-aghguaey-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1 // Idéal pour le développement local
})

export default sql