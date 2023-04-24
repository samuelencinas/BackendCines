import passport from 'passport'
import {Strategy as LocalStrategy} from 'passport-local'
import User from './models/user'

passport.use(
  new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  (username, password, done) => {
    User
      .query()
      .where('username', username)
      .first()
      .then(user => {
        if (!user) return done(null, false, {err: 'Usuario desconocido'});
        user.verifyPassword(password, (err, passwordCorrect) => {
          if (!!err) return done(err);
          if (!passwordCorrect) return done(null, false);
          return done(null, user);
        })
      }).catch(function (err) {
        done(err)
      })
  }
))

// Serializar usuarios
passport.serializeUser((user, done) => {
  done(null, user.id)
})

// Deserializar usuarios
passport.deserializeUser((id, done) => {
  User.query().findById(id).then((user) => {
    done(null, user)
  })
})