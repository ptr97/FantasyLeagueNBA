import db from '../db'

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
                        [player.id_zawodnika, resultCreateTeamQuery.rows[0].id_zespolu_uzytkownika]
                    )
                )
                await Promise.all(arrayOfPromises)
                await client.query('COMMIT')
            } catch(error) {
                console.log(error)
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
                return res.status(400).json(error)
            }
        } finally {
            client.release()
        }
        return res.status(200).json({ message: 'Fantasy team created!' })
    },

    async updateTeam(req, res) {
        const selectTeamIdText = 'SELECT id_zespolu_uzytkownika FROM nba.zespoly_uzytkownikow WHERE id_uzytkownika = $1'
        const selectTeamLineupText = 'SELECT * FROM nba.zawodnicy_zespoly_uzytkownikow WHERE id_zespolu_uzytkownika = $1'
        const deleteQueryText = 'DELETE FROM nba.zawodnicy_zespoly_uzytkownikow WHERE id_zespolu_uzytkownika = $1'
        const createLineupQuery = `INSERT INTO nba.zawodnicy_zespoly_uzytkownikow (id_zawodnika, id_zespolu_uzytkownika, wartosc_kontraktu) VALUES ($1, $2, $3) RETURNING *`
        const client = await db.pool.connect()
        try {
            const team = await client.query(selectTeamIdText, [req.user.id])
            const teamId = team.rows[0].id_zespolu_uzytkownika
            await client.query('BEGIN')
            try {
                const { rows } = await client.query(selectTeamLineupText, [teamId])
                
                const playersToInsert = req.body.newPlayers.map(newPlayer => {
                    const oldPlayersMatch = rows.find(oldPlayer => oldPlayer.id_zawodnika === newPlayer.id_zawodnika)

                    const oldContractValue = oldPlayersMatch ? oldPlayersMatch.wartosc_kontraktu : 999

                    const newContractValue = newPlayer.wartosc_kontraktu || 999

                    const bestOption = Math.min(oldContractValue, newContractValue, newPlayer.zarobki_zawodnika)

                    return {
                        id: newPlayer.id_zawodnika,
                        contract: bestOption
                    }
                
                })
                await client.query(deleteQueryText, [teamId])
                const arrayOfPromises = playersToInsert.map(player => 
                    client.query(
                        createLineupQuery,
                        [player.id, teamId, player.contract]
                    )
                )
                await Promise.all(arrayOfPromises)
                await client.query('COMMIT')
                return res.status(200).json({ 
                    message: 'Team updated.'
                })
            } catch(error) {
                await client.query('ROLLBACK')
                return res.status(400).json({
                    message: error.detail,
                    hint: error.hint
                })
            }
        } finally {
            client.release()
        }
    },

    async bestTeams(req, res) {
        const queryText = 'SELECT * FROM nba.widok_uzytkownik_zespol ORDER BY wynik_zespolu_uzytkownika DESC LIMIT 10'
        try {
            const { rows } = await db.query(queryText)
            return res.status(200).json({ fantasyTeams: rows })
        } catch(error) {
            return res.status(400).json({ error })
        }
    },
    
    async myTeamInfo(req, res) {
        const teamInfoQuery = 'SELECT * FROM nba.widok_uzytkownik_zespol WHERE id_uzytkownika = $1'
        const playersQuery = 'SELECT * FROM nba.widok_uzyt_zawodnicy JOIN nba.widok_statystyki_zawodnikow USING(id_zawodnika) WHERE id_uzytkownika = $1'
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
