import db from '../db'
import AuthHelper from './AuthHelper'

const FantasyTeams = {
    async createTeam(req, res) {
        if(!req.body.teamName) {
            return res.status(400).json({ message: 'Team name is missing!' })
        }
        const checkIfUserHasTeamQuery = 'SELECT COUNT(*) FROM nba.zespoly_uzytkownikow WHERE id_uzytkownika = $1'
        const createTeamQuery = 'INSERT INTO nba.zespoly_uzytkownikow (nazwa_zespolu_uzytkownika, id_uzytkownika) VALUES ($1, $2) RETURNING *'
        const createTeamValues = [
            req.body.teamName,
            req.user.id
        ]
        const createLineupQuery = `INSERT INTO nba.zawodnicy_zespoly_uzytkownikow (id_zawodnika, id_zespolu_uzytkownika) VALUES ($1, $2) RETURNING *`
        
        const client = await db.pool.connect()
        try {
            const resultUserHasTeamQuery = await db.query(checkIfUserHasTeamQuery, [req.user.id])
            if(resultUserHasTeamQuery.rows[0].count > 0) {
                return res.status(400).json({ message: 'You already has a team!' })
            }
            await client.query('BEGIN')
            try {
                const resultCreateTeamQuery = await client.query(createTeamQuery, createTeamValues)
                const arrayOfPromises = req.body.players.map(player => 
                    client.query(
                        createLineupQuery,
                        [player.id, resultCreateTeamQuery.rows[0].id_zespolu_uzytkownika]
                    )
                )
                await Promise.all(arrayOfPromises)
                await client.query('COMMIT')
            } catch(error) {
                // console.log(error)
                await client.query('ROLLBACK')
                if(error.routine === 'exec_stmt_raise') {
                    return res.status(400).json({ 
                        message: error.detail,
                        hint: error.hint
                    })
                }
                if(error.routine === '_bt_check_unique') {
                    return res.status(400).json({ message: 'Team with given name already exists!' })
                }
                if(error.routine === 'ExecConstraints' && error.constraint === 'zgodny_budzet') {
                    return res.status(400).json({ message: 'Players exceeded team budget!' })
                }
                return res.status(400).json(error)
            }
        } finally {
            client.release()
        }
        return res.status(200).json({ message: 'Fantasy team created!' })
    },

    async bestTeams(req, res) {
        const queryText = 'SELECT uzyt_email, zes_nazwa, zes_wynik FROM nba.widok_uzytkownik_zespol ORDER BY zes_wynik LIMIT 10'
        try {
            const { rows } = await db.query(queryText)
            return res.status(200).json({ fantasyTeams: rows })
        } catch(error) {
            return res.status(400).json({ error })
        }
    },
    
    async myTeamInfo(req, res) {
        const teamInfoQuery = 'SELECT * FROM nba.zespoly_uzytkownikow WHERE id_uzytkownika = $1'
        const playersQuery = 'SELECT zaw_id, zaw_imie, zaw_nazwisko, zaw_poz, zaw_zarobki FROM nba.widok_uzyt_zawodnicy WHERE uzyt_id = $1'
        try {
            const myTeamInfo = await db.query(teamInfoQuery, [req.user.id])
            const myPlayers = await db.query(playersQuery, [req.user.id])
            return res.status(200).json({ 
                teamInfo: myTeamInfo.rows[0],
                players: myPlayers.rows
            })
        } catch(error) {
            return res.status(400).json({ error })
        }
    },

    async deleteTeam(req, res) {
        const deleteQuery = 'DELETE FROM nba.zespoly_uzytkownikow WHERE id_uzytkownika = $1'
        try {
            await db.query(deleteQuery, [req.user.id])
            return res.status(200).json({ message: 'Team deleted' })
        } catch(error) {
            return res.status(400).json({ error })
        }
    },

    // UPDATE nba.zawodnicy_zespoly_uzytkownikow SET id_zawodnika = 203991 where id_zawodnika = 202326 AND id_zespolu_uzytkownika = 116 RETURNING *;

    async updateTeam(req, res) {
        const selectQueryText = 'SELECT id_zespolu_uzytkownika FROM nba.zespoly_uzytkownikow WHERE id_uzytkownika = $1'
        const updateQueryText = 'UPDATE nba.zawodnicy_zespoly_uzytkownikow SET id_zawodnika = $1 WHERE id_zawodnika = $2 AND id_zespolu_uzytkownika = $3 RETURNING *'
        const client = await db.pool.connect()
        try {
            const team = await client.query(selectQueryText, [req.user.id])
            const teamId = team.rows[0].id_zespolu_uzytkownika
            await client.query('BEGIN')
            try {
                const { rows } = await client.query(updateQueryText, [
                    req.body.newPlayerId, 
                    req.body.oldPlayerId, 
                    teamId
                ])
                await client.query('COMMIT')
                return res.status(200).json({ newPlayer: rows[0] })
            } catch(error) {
                await client.query('ROLLBACK')
                return res.status(400).json(error)
            }
        } finally {
            client.release()
        }
    },

    async updateTeamInfo(req, res) {
        const updateQueryText = 'UPDATE nba.zespoly_uzytkownikow SET nazwa_zespolu_uzytkownika = $1 WHERE id_uzytkownika = $2 RETURNING *'
        try {
            const { rows } = await db.query(updateQueryText, [
                req.body.newName,
                req.user.id
            ])
            return res.status(200).json({
                message: 'Team info updated.',
                myTeamInfo: rows[0]
            })
        } catch(error) {
            if(error.routine === '_bt_check_unique') {
                return res.status(400).json({ message: 'Team with given name already exists!' })
            }
            return res.status(200).json(error)
        }
    }
}

export default FantasyTeams
