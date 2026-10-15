import postgres from 'postgres'

// Chaîne de connexion lue depuis .env.local (jamais commitée)
const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL manquant : ajoute-le dans .env.local")

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1 // Idéal pour le développement local
})

// Les types de postgres.js ne déclarent pas la transaction comme appelable en tag : on la retype
export const transaction = <T>(fn: (tx: typeof sql) => Promise<T>) =>
    sql.begin(tx => fn(tx as unknown as typeof sql)) as Promise<T>

export default sql
