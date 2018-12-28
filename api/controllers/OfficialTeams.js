import db from '../db'

const OfficialTeams = {
    async allTeams(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.oficjalne_zespoly'
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
            const queryText = 'SELECT * FROM nba.oficjalne_zespoly WHERE id_oficjalnego_zespolu = $1'
            const { rows } = await db.query(queryText, [req.params.id])
            return res.status(200).json({ team: rows[0] })
        } catch(error) {
            return res.status(400).json(error)
        }
    },
}

export default OfficialTeams
