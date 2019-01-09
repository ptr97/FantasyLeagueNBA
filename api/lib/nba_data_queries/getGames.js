import axios from 'axios'
import db from '../../db'
import 'babel-polyfill'

const MatchDays = {
    _getYesterdayDate() {
        const today = new Date()
        let dd = today.getDate() - 1
        let mm = today.getMonth() + 1
        const yyyy = today.getFullYear()
        if(dd < 10) {
            dd = '0' + dd
        } 
        if(mm < 10) {
            mm = '0' + mm
        } 
        return '' + yyyy + mm + dd
    },

    async getPastGameDays(from, to) {
        try {
            const pastGameDaysJson = await axios.get(`http://data.nba.net/10s/prod/v1/calendar.json`)
            const pastMatchDays = []
            Object.entries(pastGameDaysJson.data).forEach(
                ([key, value]) => {
                    // start sezonu = 20181016
                    if(key >= (from || 20181016) && key < (to || this._getYesterdayDate()) && value > 0) {
                        pastMatchDays.push(key)
                    }
                }
            )
            return pastMatchDays
        } catch(error) {
            console.log(error)
        }
    }
}


const GamesFromDay = {
    async getGamesFrom(day) {
        try {
            const gamesJson = await axios.get(`http://data.nba.net/10s/prod/v2/${day}/scoreboard.json`)
            const games = gamesJson.data.games.map(game => {
                return {
                    id_meczu: game.gameId,
                    data_meczu: game.startDateEastern,
                    id_zespolu_gospodarzy: game.hTeam.teamId,
                    id_zespolu_gosci: game.vTeam.teamId,
                    punkty_zespolu_gospodarzy: game.hTeam.score,
                    punkty_zespolu_gosci: game.vTeam.score
                }
            })
                games.map(async game => 
                    await db.query('INSERT INTO nba.mecze VALUES ($1, $2, $3, $4, $5, $6)', [
                        game.id_meczu,
                        game.data_meczu,
                        game.id_zespolu_gospodarzy,
                        game.id_zespolu_gosci,
                        game.punkty_zespolu_gospodarzy,
                        game.punkty_zespolu_gosci,
                    ])
                )
            const gamesIds = games.map(game => game.id_meczu)
            return gamesIds
        } catch(error) {
            console.log(error)
        }
    }, 

    async getStatsFrom(day, gamesIds) {
        try {
            const arrayOfPromises = gamesIds.map(gameId => 
                axios.get(`http://data.nba.net/10s/prod/v1/${day}/${gameId}_boxscore.json`)
            )
            const gamesData = await Promise.all(arrayOfPromises)
            const playersStats = gamesData.map(game => 
                game.data.stats.activePlayers.map(player => 
                    ({
                        id_zawodnika: player.personId,
                        id_meczu: game.data.basicGameData.gameId,
                        data_meczu: day,
                        punkty_zawodnika: player.points,
                        asysty_zawodnika: player.assists,
                        zbiorki_zawodnika: player.totReb,
                        przechwyty_zawodnika: player.steals,
                        straty_zawodnika: player.turnovers,
                    })
                )
            )
            playersStats.map(async stats => {
                return stats.map(async player => {
                    await db.query('INSERT INTO nba.statystyki_meczu VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
                        player.id_zawodnika,
                        player.id_meczu,
                        player.data_meczu,
                        player.punkty_zawodnika,
                        player.asysty_zawodnika,
                        player.zbiorki_zawodnika,
                        player.przechwyty_zawodnika,
                        player.straty_zawodnika
                    ])
                })
            })

        } catch(error) {
            console.log(error)
        }
    },

    async getGamesWithStatsFrom(day) {
        const gamesIds = await GamesFromDay.getGamesFrom(day)
        await GamesFromDay.getStatsFrom(day, gamesIds)
    }
}

const InsertionsToDb = {
    async insertPastGamesToDb() {
        try {
            const pastMatchDays = await MatchDays.getPastGameDays()
            const arrayOfPromises = pastMatchDays.map(day => GamesFromDay.getGamesWithStatsFrom(day))

            await Promise.all(arrayOfPromises)
        } catch(error) {
            console.log(error)
        }
    },

    async insertTonightGamesToDb() {
        try {
            console.log('Inserting today games to DataBase.')
            await GamesFromDay.getGamesWithStatsFrom(MatchDays._getYesterdayDate())
            await console.log('Games inserted.')
        } catch(error) {
            console.log(error)
        }
    },

    async insertGamesToDbFrom(day) {
        try {
            await GamesFromDay.getGamesWithStatsFrom(day)
        } catch(error) {
            console.log(error)
        }
    },
}


// InsertionsToDb.insertPastGamesToDb()


// InsertionsToDb.insertGamesToDbFrom(20181016)
// InsertionsToDb.insertGamesToDbFrom(20181017)
// InsertionsToDb.insertGamesToDbFrom(20181018)

// InsertionsToDb.insertGamesToDbFrom(20181019)
// InsertionsToDb.insertGamesToDbFrom(20181020)
// InsertionsToDb.insertGamesToDbFrom(20181021)

// InsertionsToDb.insertGamesToDbFrom(20181022)
// InsertionsToDb.insertGamesToDbFrom(20181023)
// InsertionsToDb.insertGamesToDbFrom(20181024)

// InsertionsToDb.insertGamesToDbFrom(20181025)
// InsertionsToDb.insertGamesToDbFrom(20181026)
// InsertionsToDb.insertGamesToDbFrom(20181027)
// InsertionsToDb.insertGamesToDbFrom(20181028)
// InsertionsToDb.insertGamesToDbFrom(20181029)
// InsertionsToDb.insertGamesToDbFrom(20181030)

// InsertionsToDb.insertGamesToDbFrom(20190103)


// InsertionsToDb.insertTonightGamesToDb()

export default InsertionsToDb
