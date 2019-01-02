import chai from 'chai'
import chaiHttp from 'chai-http'
import db from '../db'
import app from '../index'

chai.use(chaiHttp)
chai.should()

let userToken

describe('Users', () => {
    before((done) => {
        db.query(`DELETE FROM nba.uzytkownicy WHERE email_uzytkownika = $1`, ['michael@jordan.com'])
        done()
    })

    after((done) => {
        db.query(`DELETE FROM nba.uzytkownicy WHERE email_uzytkownika = $1`, ['michael@jordan.com'])
        done()
    })

    it('should not create a new user if email is missing', (done) => {
        chai.request(app)
            .post('/api/users')
            .send({
                password: 'fadeaway',
                firstName: 'Michael',
                lastName: 'Jordan'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Some values are missing!')
                done()
            })
    })

    it('should not create a new user if password is missing', (done) => {
        chai.request(app)
            .post('/api/users')
            .send({
                email: 'michael@jordan.com',
                firstName: 'Michael',
                lastName: 'Jordan'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Some values are missing!')
                done()
            })
    })

    it('should not create a new user if first name is missing', (done) => {
        chai.request(app)
            .post('/api/users')
            .send({
                email: 'michael@jordan.com',
                password: 'fadeaway',
                lastName: 'Jordan'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Some values are missing!')
                done()
            })
    })

    it('should not create a new user if last name is missing', (done) => {
        chai.request(app)
            .post('/api/users')
            .send({
                email: 'michael@jordan.com',
                password: 'fadeaway',
                firstName: 'Michael'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Some values are missing!')
                done()
            })
    })

    it('should not create a new user if email is incorrect', (done) => {
        chai.request(app)
            .post('/api/users')
            .send({
                password: 'fadeaway',
                email: 'incorrectEmail',
                firstName: 'Michael',
                lastName: 'Jordan'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Please provide a valid e-mail address!')
                done()
            })
    })

    it('should create a new user if not exists on POST /api/users', (done) => {
        chai.request(app)
            .post('/api/users')
            .send({ 
                email: 'michael@jordan.com',
                password: 'fadeaway',
                firstName: 'Michael',
                lastName: 'Jordan'
            })
            .end((err, res) => {
                res.should.have.status(201)
                res.body.should.have.property('token')
                done()
            })
    })

    it('should not create a new user if user with given email already exists', (done) => {
        chai.request(app)
            .post('/api/users')
            .send({ 
                email: 'michael@jordan.com',
                password: 'fadeaway',
                firstName: 'Michael',
                lastName: 'Jordan'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('User with that email address already exists!')
                done()
            })
    })

    it('should not login user when email is not provided', (done) => {
        chai.request(app)
            .post('/api/users/login')
            .send({ 
                password: 'fadeaway'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Some values are missing!')
                done()
            })
    })

    it('should not login user when password is not provided', (done) => {
        chai.request(app)
            .post('/api/users/login')
            .send({ 
                email: 'michael@jordan.com',
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Some values are missing!')
                done()
            })
    })

    it('should not login user when provided email has incorrect form', (done) => {
        chai.request(app)
            .post('/api/users/login')
            .send({ 
                email: 'incorrectEmail',
                password: 'fadeaway'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('Please provide a valid e-mail address!')
                done()
            })
    })

    it('should not login user when user does not exist', (done) => {
        chai.request(app)
            .post('/api/users/login')
            .send({ 
                email: 'noone@nodomain.com',
                password: 'password'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('The credentials you provided are incorrect!')
                done()
            })
    })

    it('should not login user when provided password is incorrect', (done) => {
        chai.request(app)
            .post('/api/users/login')
            .send({ 
                email: 'michael@jordan.com',
                password: 'incorrectPassword'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('The credentials you provided are incorrect!')
                done()
            })
    })

    it('should login user on POST /api/users/login', (done) => {
        chai.request(app)
            .post('/api/users/login')
            .send({ 
                email: 'michael@jordan.com',
                password: 'fadeaway'
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('token')
                userToken = res.body.token
                done()
            })
    })

    it('should not return user data when token is not provided', (done) => {
        chai.request(app)
            .get('/api/users/me')
            .end((err, res) => {
                res.should.have.status(403)
                res.body.should.have.property('message').eql('Token is not provided!')
                done()
            })
    })

    it('should not return user data when token is incorrect', (done) => {
        chai.request(app)
            .get('/api/users/me')
            .set('x-access-token', 'incorrectToken.1234')
            .end((err, res) => {
                res.should.have.status(400)
                done()
            })
    })

    it('should return user data on GET /api/users/me', (done) => {
        chai.request(app)
            .get('/api/users/me')
            .set('x-access-token', userToken)
            .end((err, res) => {
                res.should.have.status(200)
                res.should.be.a('Object')
                res.body.should.have.property('email_uzytkownika').eql('michael@jordan.com')
                res.body.should.have.property('imie_uzytkownika').eql('Michael')
                res.body.should.have.property('nazwisko_uzytkownika').eql('Jordan')
                done()
            })
    })

    it('should update user data on PUT /api/users/me', (done) => {
        chai.request(app)
            .put('/api/users/me')
            .set('x-access-token', userToken)
            .send({ 
                firstName: 'Mike',
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('imie_uzytkownika').eql('Mike')
                res.body.should.have.property('nazwisko_uzytkownika').eql('Jordan')
                done()
            })
    })

    it('should not update user password when old password is incorrect', (done) => {
        chai.request(app)
            .put('/api/users/me/password')
            .set('x-access-token', userToken)
            .send({ 
                oldPassword: 'incorrectPassword',
                newPassword: 'fadeaway123'
            })
            .end((err, res) => {
                res.should.have.status(400)
                res.body.should.have.property('message').eql('You provide wrong password!')
                done()
            })
    })

    it('should update user password on PUT /api/users/me/password', (done) => {
        chai.request(app)
            .put('/api/users/me/password')
            .set('x-access-token', userToken)
            .send({ 
                oldPassword: 'fadeaway',
                newPassword: 'fadeaway123'
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('message').eql('Password updated')
                done()
            })
    })

    it('should update user password once again on PUT /api/users/me/password', (done) => {
        chai.request(app)
            .put('/api/users/me/password')
            .set('x-access-token', userToken)
            .send({ 
                oldPassword: 'fadeaway123',
                newPassword: 'fadeaway'
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('message').eql('Password updated')
                done()
            })
    })

    it('should delete user on DELETE /api/users/me', (done) => {
        chai.request(app)
            .delete('/api/users/me')
            .set('x-access-token', userToken)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.have.property('message').eql('Account deleted')
                done()
            })
    })
})
