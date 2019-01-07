import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const AuthHelper = {
    hashPassword(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(6))
    },

    comparePassword(hashPassword, password) {
        return bcrypt.compareSync(password, hashPassword)
    },

    isValidEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    },

    generateToken(id) {
        return jwt.sign({ userId: id }, process.env.SECRET, { expiresIn: '12h' })
    },
}

export default AuthHelper