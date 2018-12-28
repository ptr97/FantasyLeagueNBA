import httpRequest from './httpRequest'
import db from '../../db'
import 'babel-polyfill'

const url = 'http://data.nba.net/10s/prod/v2/2018/teams.json'


httpRequest(url).then(teams => 
    teams.league.standard.filter(team => team.isNBAFranchise)
    ).then(ar => ar.map(t => ({
            id_oficjalnego_zespolu: t.teamId,
            nazwa_oficjalnego_zespolu: t.fullName,
            kod_oficjalnego_zespolu: t.tricode,
            dywizja_oficjalnego_zespolu: t.divName,
            konferencja_oficjalnego_zespolu: t.confName
        }))
    ).then(data => data.map(teamRecord => 
        db.query(
            'INSERT INTO nba.oficjalne_zespoly VALUES ($1, $2, $3, $4, $5)', 
            [
                teamRecord.id_oficjalnego_zespolu, 
                teamRecord.nazwa_oficjalnego_zespolu, 
                teamRecord.kod_oficjalnego_zespolu, 
                teamRecord.dywizja_oficjalnego_zespolu, 
                teamRecord.konferencja_oficjalnego_zespolu
            ]))
    ).catch(console.error)
