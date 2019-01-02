import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '../index'
import db from '../db'

chai.use(chaiHttp)
chai.should()

let mikeToken
const mikeData = { 
    email: 'michael@jordan.com',
    password: 'fadeaway',
    firstName: 'Michael',
    lastName: 'Jordan'
}

let larryToken
const larryData = {
    email: 'Larry@Bird.com',
    password: '3pt',
    firstName: 'Larry',
    lastName: 'Bird'
}

const myPlayers = [
    {
        position: 'G',
        id: 201939 // Curry
    },
    {
        position: 'G',
        id: 202691 // Thompson
    },
    {
        position: 'F',
        id: 201142 // Durant
    },
    {
        position: 'F',
        id: 203110 // Green
    },
    {
        position: 'C',
        id: 202326 // Cousins
    }
]

const tooManyGuards = [
    {
        position: 'G',
        id: 201939 // Curry
    },
    {
        position: 'G',
        id: 202691 // Thompson
    },
    {
        position: 'G',
        id: 203078 // Beal
    },
    {
        position: 'F',
        id: 203110 // Green
    },
    {
        position: 'C',
        id: 202326 // Cousins
    }
]

const tooManyForwards = [
    {
        position: 'G',
        id: 201939 // Curry
    },
    {
        position: 'F',
        id: 2546 // Carmelo Anthony
    },
    {
        position: 'F',
        id: 201142 // Durant
    },
    {
        position: 'F',
        id: 203110 // Green
    },
    {
        position: 'C',
        id: 202326 // Cousins
    }
]

const tooManyCenters = [
    {
        position: 'C',
        id: 203991 // Clint Capela
    },
    {
        position: 'G',
        id: 202691 // Thompson
    },
    {
        position: 'F',
        id: 201142 // Durant
    },
    {
        position: 'F',
        id: 203110 // Green
    },
    {
        position: 'C',
        id: 202326 // Cousins
    }
]

const expensivePlayers = [
    {
        position: 'G',
        id: 201939 // Curry
    },
    {
        position: 'G',
        id: 202691 // Thompson
    },
    {
        position: 'F',
        id: 201142 // Durant
    },
    {
        position: 'F',
        id: 203110 // Green
    },
    {
        position: 'C',
        id: 202326 // Cousins
    }
]

describe(`Fantasy Teams`, () => {
    before((done) => {
        chai.request(app)
            .post('/api/users')
            .send(mikeData)
            .end((err, res) => {
                mikeToken = res.body.token
                chai.request(app)
                    .post('/api/users')
                    .send(larryData)
                    .end((err, response) => {
                        larryToken = response.body.token
                        done()
                    }
            )}
    )})

    after((done) => {
        chai.request(app)
            .delete('/api/users/me')
            .set('x-access-token', mikeToken)
            .end((err, res) => {
                chai.request(app)
                    .delete('/api/users/me')
                    .set('x-access-token', larryToken)
                    .end((err, resp) => {
                        done()
                    })
            })
    })

    // /api/fantasy-teams
    it(`should not create fantasy team if team name is not provided`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                players: myPlayers
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Team name is missing!')
                done()
            })
    })

    it(`should not create fantasy team if there is too many guards`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MyUniqueTeam',
                players: tooManyGuards
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Niewystarczajaca ilosc skrzydlowych (< 2) w druzynie! Twoja druzyna sklada sie z 1 skrzydlowych')
                res.body.should.have.property('hint').eql('W druzynie powinno byc dwoch skrzydlowych.')
                done()
            })
    })

    it(`should not create fantasy team if there is too many forwards`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MyUniqueTeam',
                players: tooManyForwards
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Niewystarczajaca ilosc obroncow (< 2) w druzynie! Twoja druzyna sklada sie z 1 obroncow')
                res.body.should.have.property('hint').eql('W druzynie powinno byc dwoch obroncow.')
                done()
            })
    })

    it(`should not create fantasy team if there is too many centers`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MyUniqueTeam',
                players: tooManyCenters
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Niewystarczajaca ilosc obroncow (< 2) w druzynie! Twoja druzyna sklada sie z 1 obroncow')
                res.body.should.have.property('hint').eql('W druzynie powinno byc dwoch obroncow.')
                done()
            })
    })

    it(`should not create fantasy team if there is less than 5 players`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MyUniqueTeam',
                players: [
                    {
                        position: 'G',
                        id: 201939 // Curry
                    },
                    {
                        position: 'G',
                        id: 202691 // Thompson
                    },
                    {
                        position: 'F',
                        id: 201142 // Durant
                    }
                ]
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Nieprawidlowa ilosc zawodnikow w druzynie! Twoja druzyna sklada sie z 3 zawodnikow')
                res.body.should.have.property('hint').eql('Druzyna powinna skladac sie z 5 zawodnikow.')
                done()
            })
    })

    it(`should not create fantasy team if there is more than 5 players`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MyUniqueTeam',
                players: [
                    {
                        position: 'G',
                        id: 201939 // Curry
                    },
                    {
                        position: 'G',
                        id: 202691 // Thompson
                    },
                    {
                        position: 'F',
                        id: 201142 // Durant
                    },
                    {
                        position: 'G',
                        id: 203078 // Beal
                    },
                    {
                        position: 'F',
                        id: 203110 // Green
                    },
                    {
                        position: 'C',
                        id: 202326 // Cousins
                    }
                ]
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Nieprawidlowa ilosc zawodnikow w druzynie! Twoja druzyna sklada sie z 6 zawodnikow')
                res.body.should.have.property('hint').eql('Druzyna powinna skladac sie z 5 zawodnikow.')
                done()
            })
    })

    it(`should not create fantasy team if players are not unique`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MyUniqueTeam',
                players: [
                    {
                        position: 'G',
                        id: 201939 // Curry
                    },
                    {
                        position: 'G',
                        id: 201939 // Curry
                    },
                    {
                        position: 'F',
                        id: 201142 // Durant
                    },
                    {
                        position: 'F',
                        id: 203110 // Green
                    },
                    {
                        position: 'C',
                        id: 202326 // Cousins
                    }
                ]
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('W druzynie powtarzaja sie zawodnicy!')
                res.body.should.have.property('hint').eql('Druzyna powinna skladac sie z 5 roznych zawodnikow.')
                done()
            })
    })

    it(`should not create fantasy team if players salary is exceeded`, async () => {
        const ids = expensivePlayers.map(player => player.id)
        const queryText = 'UPDATE nba.zawodnicy SET zarobki_zawodnika = $1 WHERE id_zawodnika = $2 OR id_zawodnika = $3 OR id_zawodnika = $4 OR id_zawodnika = $5 OR id_zawodnika = $6'
        try {
            await db.query(queryText, [99, ...ids])
            const res = await chai.request(app)
                .post('/api/fantasy-teams')
                .set('x-access-token', mikeToken)
                .send({
                    teamName: 'MyUniqueTeam',
                    players: expensivePlayers
                })

            res.should.have.status(400)
            res.body.should.have.property('message').eql('Players exceeded team budget!')
            await db.query(queryText, [70, ...ids])
        } catch(error) {
            console.log(error)
        }
    })

    it(`should create fantasy team for user on POST /api/fantasy-teams`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MyUniqueTeam',
                players: myPlayers
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('message').eql('Fantasy team created!')
                done()
            })
    })

    it(`should not create fantasy team if user already has one`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', mikeToken)
            .send({
                teamName: 'MySecondTeam'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('You already has a team!')
                done()
            })
    })

    it(`should not create fantasy team if team with given name already exists`, (done) => {
        chai.request(app)
            .post('/api/fantasy-teams')
            .set('x-access-token', larryToken)
            .send({
                teamName: 'MyUniqueTeam'
            })
            .end((err, response) => {
                response.should.have.status(400)
                response.body.should.have.property('message').eql('Team with given name already exists!')
                done()
            })
    })

    it(`should return fantasy teams with best scores on GET /api/fantasy-teams`, (done) => {
        chai.request(app)
            .get('/api/fantasy-teams')
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('fantasyTeams')
                res.body.fantasyTeams.should.be.an('array')
                res.body.fantasyTeams[0].should.have.property('zes_nazwa').eql('MyUniqueTeam')
                done()
            })
    })

    // /api/fantasy-teams/my-team
    it(`should return user fantasy team on GET /api/fantasy-teams/my-team`, (done) => {
        chai.request(app)
            .get('/api/fantasy-teams/my-team')
            .set('x-access-token', mikeToken)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('players')
                res.body.players.should.be.an('array')
                res.body.should.have.property('teamInfo')
                res.body.teamInfo.nazwa_zespolu_uzytkownika.should.eql('MyUniqueTeam')
                res.body.teamInfo.wynik_zespolu_uzytkownika.should.eql('0')
                res.body.teamInfo.budzet_zespolu_uzytkownika.should.eql(440)
                done()
            })
    })

    it(`should update user fantasy team lineup on PUT /api/fantasy-teams/my-team`, (done) => {
        chai.request(app)
            .put('/api/fantasy-teams/my-team')
            .set('x-access-token', mikeToken)
            .send({
                newPlayerId: 203991,
                oldPlayerId: 202326,
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('newPlayer')
                res.body.newPlayer.should.have.property('id_zawodnika').eql('203991')
                done()
            })
    })

    // /api/fantasy-teams/my-team/info
    it(`should update user's fantasy team info on PUT /api/fantasy-teams/my-team/info`, (done) => {
        chai.request(app)
            .put('/api/fantasy-teams/my-team/info')
            .set('x-access-token', mikeToken)
            .send({
                newName: 'MyTeamWithNewName'
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('message').eql('Team info updated.')
                res.body.should.have.property('myTeamInfo')
                res.body.myTeamInfo.nazwa_zespolu_uzytkownika.should.eql('MyTeamWithNewName')
                done()
            })
    })

    it(`should delete a user fantasy team on DELETE /api/fantasy-teams/my-team`, (done) => {
        chai.request(app)
            .delete('/api/fantasy-teams/my-team')
            .set('x-access-token', mikeToken)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('message').eql('Team deleted')
                done()
            })
    })
})
