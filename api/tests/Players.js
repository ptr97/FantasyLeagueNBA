import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '../index'

chai.use(chaiHttp)
chai.should()

describe('NBA Players', () => {
    it('should return all NBA players on GET /api/players', (done) => {
        chai.request(app)
            .get('/api/players')
            .end((err, res) => {
                res.should.have.status(200)
                res.should.be.json
                res.should.be.a('Object')
                done()
            })
    })

    it('shuld return NBA player with given id on GET /api/players/:id', (done) => {
        chai.request(app)
            .get('/api/players/201939')
            .end((err, res) => {
                res.should.have.status(200)
                res.should.be.json
                res.should.be.a('Object')
                res.body.should.have.property('player')
                res.body.player.should.have.property('id_zawodnika').eql('201939')
                res.body.player.should.have.property('nazwisko_zawodnika').eql('Curry')
                res.body.player.should.have.property('imie_zawodnika').eql('Stephen')
                done()
            })
    })
})
