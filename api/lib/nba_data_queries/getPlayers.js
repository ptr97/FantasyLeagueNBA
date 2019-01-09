import httpRequest from './httpRequest'
import db from '../../db'
import 'babel-polyfill'

const url = 'http://data.nba.net/10s/prod/v2/2018/players.json'
    
const Players = {
    async popPlayers() {
        try {
            const players = await httpRequest(url)
            const toInsert = players.league.standard.filter(player => player.isActive)
                .map(player => ({
                    id_zawodnika: player.personId,
                    id_oficjalnego_zespolu: player.teamId,
                    nazwisko_zawodnika: player.lastName,
                    imie_zawodnika: player.firstName,
                    pozycja_zawodnika: player.pos,
                    numer_koszulki: player.jersey || '0',
                    waga_zawodnika: player.weightKilograms || 100,
                    wzrost_zawodnika: player.heightMeters || 2.0
            }))
            console.log(toInsert)
            
            toInsert.map(async player => 
                await db.query(
                    'INSERT INTO nba.zawodnicy VALUES ($1, $2, $3, $4, $5, $6, DEFAULT, $7, $8)',
                    [
                        player.id_zawodnika,
                        player.id_oficjalnego_zespolu,
                        player.nazwisko_zawodnika,
                        player.imie_zawodnika,
                        player.pozycja_zawodnika,
                        player.numer_koszulki,
                        player.waga_zawodnika,
                        player.wzrost_zawodnika
                    ]
                )    
            )
        } catch(error) {
            console.log(error)
        }    
    }
}

Players.popPlayers()
