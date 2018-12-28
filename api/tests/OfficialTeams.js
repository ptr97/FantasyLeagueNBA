import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '../index'

chai.use(chaiHttp)
chai.should()

describe('Official Teams', () => {
    it('should return all NBA teams on GET /api/official-teams', (done) => {
        chai.request(app)
            .get('/api/official-teams')
            .end((err, res) => {
                res.should.have.status(200)
                res.should.be.json
                res.should.be.a('Object')
                res.body.should.have.property('teamCount').eql(30)
                done()
            })
    })

    it('shuld return NBA team with given id on GET /api/official-teams/:id', (done) => {
        chai.request(app)
            .get('/api/official-teams/1610612744')
            .end((err, res) => {
                res.should.have.status(200)
                res.should.be.json
                res.should.be.a('Object')
                res.body.should.have.property('team')
                res.body.team.should.have.property('id_oficjalnego_zespolu').eql('1610612744')
                res.body.team.should.have.property('nazwa_oficjalnego_zespolu').eql('Golden State Warriors')
                done()
            })
    })
})
