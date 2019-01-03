import express from 'express'
import 'babel-polyfill'
import cron from 'node-cron'
import InsertionsToDb from './lib/nba_data_queries/getGames.js'
import Auth from './middleware/Auth'
import Users from './controllers/Users'
import FantasyTeams from './controllers/FantasyTeams'
import OfficialTeams from './controllers/OfficialTeams'
import Players from './controllers/Players'
import Games from './controllers/Games'


const app = express()
app.use(express.json())
app.use(require('cors')())
app.set('port', process.env.PORT || 3000)

cron.schedule('00 00 8 * * *', () => {
    InsertionsToDb.insertTonightGamesToDb()
  })

const router = express.Router()
app.use('/api', router)


app.get('/', (req, res) => {
    res.status(200).json({ 
        routes: [
            {createUser: '/api/users (POST)'},
            {logIn: '/api/users/login (POST)'},
            {deleteUser: '/api/users/me (POST)'},
            {updateUserInfo: '/api/users/me (PUT)'},
            {readUserInfo: '/api/users/me (GET)'},
        ]
    })
})

// User
router.post('/users', Users.createUser)
router.post('/users/login', Users.logIn)
router.delete('/users/me', Auth.verifyToken, Users.deleteUser)
router.put('/users/me', Auth.verifyToken, Users.updateUserInfo)
router.get('/users/me', Auth.verifyToken, Users.readUserData)
router.put('/users/me/password', Auth.verifyToken, Users.updateUserPassword)

// FantasyTeams
router.post('/fantasy-teams', Auth.verifyToken, FantasyTeams.createTeam)
router.get('/fantasy-teams', FantasyTeams.bestTeams)
router.get('/fantasy-teams/my-team', Auth.verifyToken, FantasyTeams.myTeamInfo)
router.delete('/fantasy-teams/my-team', Auth.verifyToken, FantasyTeams.deleteTeam)
router.put('/fantasy-teams/my-team', Auth.verifyToken, FantasyTeams.updateTeam)
router.put('/fantasy-teams/my-team/info', Auth.verifyToken, FantasyTeams.updateTeamInfo)

// Games


// OfficialTeams
router.get('/official-teams', OfficialTeams.allTeams)
router.get('/official-teams/:id', OfficialTeams.getTeam)

// Players
router.get('/players', Players.allPlayers)
router.get('/players/:id', Players.getPlayer)

// 404 && 500
app.use((req, res) => { 
    res.status(404).json({ message: '404 - Not Found' })
})

app.use((err, req, res, next) => { 
    console.error(err.stack)
    res.status(500).json({ message: '500 - Server Error' })
})

app.listen(app.get('port'), () => {
console.log('Express started on http://localhost:' +
        app.get('port') + '; press Ctrl-C to terminate.')
})

export default app
