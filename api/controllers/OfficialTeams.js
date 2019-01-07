import db from '../db'

const OfficialTeams = {
    async allTeams(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_zespoly_bilans'
            const { rows, rowCount } = await db.query(queryText)
            return res.status(200).json({
                allTeams: rows,
                teamCount: rowCount,
            })
        } catch(error) {
            return res.status(400).json(error)
        }
    },

    async getTeam(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_zespoly_bilans WHERE id_oficjalnego_zespolu = $1'
            const { rows } = await db.query(queryText, [req.params.id])
            return res.status(200).json({ team: rows[0] })
        } catch(error) {
            return res.status(400).json(error)
        }
    },

    async getTeamPlayers(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.zawodnicy WHERE id_oficjalnego_zespolu = $1'
            const { rows, rowCount } = await db.query(queryText, [req.params.id])
            return res.status(200).json({
                players: rows,
                playersCount: rowCount,
            })
        } catch(error) {
            return res.status(400).json(error)
        }
    }
}

export default OfficialTeams
