import db from '../db'
import AuthHelper from './AuthHelper'

const Users = {
    async createUser(req, res) {
        if(!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName) {
            return res.status(400).json({ 
                message: 'Some values are missing!'
            })
        }
        if(!AuthHelper.isValidEmail(req.body.email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid e-mail address!'
            })
        }

        const hashPassword = AuthHelper.hashPassword(req.body.password)
        const queryText = `INSERT INTO nba.uzytkownicy 
            (email_uzytkownika, haslo_uzytkownika, imie_uzytkownika, nazwisko_uzytkownika) 
            VALUES ($1, $2, $3, $4) RETURNING *`
        const queryValues = [
            req.body.email,
            hashPassword,
            req.body.firstName,
            req.body.lastName,
        ]

        try {
            const { rows } = await db.query(queryText, queryValues)
            const token = AuthHelper.generateToken(rows[0].id_uzytkownika)
            return res.status(201).json({ token })
        } catch(error) {
            if(error.routine === '_bt_check_unique') {
                return res.status(400).json({ 
                    message: 'User with that email address already exists!'
                })
            }
            return res.status(400).json({
                message: error
            })
        }
    },

    async logIn(req, res) {
        if(!req.body.email || !req.body.password) {
            return res.status(400).json({ 
                message: 'Some values are missing!'
            })
        }
        if(!AuthHelper.isValidEmail(req.body.email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid e-mail address!'
            })
        }

        const queryText = `SELECT * FROM nba.uzytkownicy WHERE email_uzytkownika = $1`
        try {
            const { rows } = await db.query(queryText, [req.body.email])
            if(!rows[0]) {
                return res.status(400).json({ 
                    message: 'The credentials you provided are incorrect!' 
                })
            }
            if(!AuthHelper.comparePassword(rows[0].haslo_uzytkownika, req.body.password)) {
                return res.status(400).json({ 
                    message: 'The credentials you provided are incorrect!'
                })
            }
            const token = AuthHelper.generateToken(rows[0].id_uzytkownika)
            return res.status(200).json({ token })
        } catch(error) {
            return res.status(400).json({
                message: error
            })
        }
    },

    async deleteUser(req, res) {
        const deleteQuery = 'DELETE FROM nba.uzytkownicy WHERE id_uzytkownika = $1 RETURNING *'
        try {
            const { rows } = await db.query(deleteQuery, [req.user.id])
            if(!rows[0]) {
                return res.status(400).json({ 
                    message: 'User not found!'
                })
            }
            else {
                return res.status(200).json({ 
                    message: 'Account deleted'
                })
            }
        } catch(error) {
            return res.status(400).json({
                message: error
            })
        }
    },

    async readUserData(req, res) {
        const queryText = `SELECT email_uzytkownika, imie_uzytkownika, nazwisko_uzytkownika FROM nba.uzytkownicy WHERE id_uzytkownika = $1`
        try {
            const { rows } = await db.query(queryText, [req.user.id])
            if(!rows[0]) {
                return res.status(400).json({ 
                    message: 'User not found!' 
                })
            }
            else {
                return res.status(200).json({
                    data: rows[0]
                })
            }
        } catch(error) {
            return res.status(400).json({
                message: error
            })
        }
    },

    async updateUserInfo(req, res) {
        const selectQueryText = `SELECT email_uzytkownika, imie_uzytkownika, nazwisko_uzytkownika FROM nba.uzytkownicy WHERE id_uzytkownika = $1`
        const updateQueryText = `UPDATE nba.uzytkownicy SET email_uzytkownika = $1, imie_uzytkownika = $2, nazwisko_uzytkownika = $3 WHERE id_uzytkownika = $4 RETURNING email_uzytkownika, imie_uzytkownika, nazwisko_uzytkownika`
        try {
            const { rows } = await db.query(selectQueryText, [req.user.id])
            if(!rows[0]) {
                return res.status(400).json({ 
                    message: 'User not found!'
                })
            }
            const queryValues = [
                req.body.email || rows[0].email_uzytkownika,
                req.body.firstName || rows[0].imie_uzytkownika,
                req.body.lastName || rows[0].nazwisko_uzytkownika,
                req.user.id
            ]
            const response = await db.query(updateQueryText, queryValues)
            return res.status(200).json({ 
                data: response.rows[0],
                message: 'Profile updated.'
            })
        } catch(error) {
            return res.status(400).json({
                message: error
            })
        }
    },

    async updateUserPassword(req, res) {
        const checkQueryText = `SELECT haslo_uzytkownika FROM nba.uzytkownicy WHERE id_uzytkownika = $1`
        const updateQueryText = `UPDATE nba.uzytkownicy
            SET haslo_uzytkownika = $1
            WHERE id_uzytkownika = $2`
        try {
            const { rows } = await db.query(checkQueryText, [req.user.id])
            if(!rows[0]) {
                return res.status(400).json({ 
                    message: 'User not found!'
                })
            }
            if(!AuthHelper.comparePassword(rows[0].haslo_uzytkownika, req.body.oldPassword)) {
                return res.status(400).json({ 
                    message: 'You provide wrong password!'
                })
            }
            const hashNewPassword = AuthHelper.hashPassword(req.body.newPassword)
            const queryValues = [
                hashNewPassword,
                req.user.id
            ]
            await db.query(updateQueryText, queryValues)
            return res.status(200).json({ 
                message: 'Password updated.'
            })
        } catch(error) {
            return res.status(400).json({
                message: error
            })
        }
    },
}

export default Users
