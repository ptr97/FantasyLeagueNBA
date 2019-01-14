import db from '../db'

const Players = {
    async allPlayers(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_statystyki_zawodnikow'
            const { rows, rowCount } = await db.query(queryText)
            return res.status(200).json({
                allPlayers: rows,
                playerCount: rowCount,
            })
        } catch(error) {
            return res.status(400).json(error)
        }
    },

    async allPlayersPagination(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_statystyki_zawodnikow ORDER BY ppg DESC LIMIT 15 OFFSET (($1 - 1) * 15)'
            const { rows, rowCount } = await db.query(queryText, [req.params.no])
            return res.status(200).json({
                players: rows,
                playerCount: rowCount,
                page: req.params.no
            })
        } catch(error) {
            return res.status(400).json(error)
        }
    },

    async leagueLeadersPoints(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_statystyki_zawodnikow ORDER BY ppg DESC LIMIT 10'
            const { rows } = await db.query(queryText)
            return res.status(200).json({ players: rows })
        } catch(error) {
            return res.status(400).json(error)
        }
    },

    async leagueLeadersAsists(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_statystyki_zawodnikow ORDER BY apg DESC LIMIT 10'
            const { rows } = await db.query(queryText)
            return res.status(200).json({ players: rows })
        } catch(error) {
            return res.status(400).json(error)
        }
    },

    async leagueLeadersRebounds(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_statystyki_zawodnikow ORDER BY rpg DESC LIMIT 10'
            const { rows } = await db.query(queryText)
            return res.status(200).json({ players: rows })
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

    async getPlayerStats(req, res) {
        try {
            const queryText = 'SELECT * FROM nba.widok_statystyki_zawodnikow WHERE id_zawodnika = $1'
            const { rows } = await db.query(queryText, [req.params.id])
            return res.status(200).json({ stats: rows[0] })
        } catch(error) {
            return res.status(400).json(error)
        }
    },
}

export default Players
