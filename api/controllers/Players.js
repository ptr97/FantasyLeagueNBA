import db from '../db'

const Players = {
    async allPlayers(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.zawodnicy'
            const { rows, rowCount } = await db.query(queryText)
            return res.status(200).json({
                allPlayers: rows,
                playerCount: rowCount,
            })
        } catch(error) {
            return res.status(400).json(error)
        }
    },

    async getPlayer(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.zawodnicy WHERE id_zawodnika = $1'
            const { rows } = await db.query(queryText, [req.params.id])
            return res.status(200).json({ player: rows[0] })
        } catch(error) {
            return res.status(400).json(error)
        }
    },
}

export default Players
