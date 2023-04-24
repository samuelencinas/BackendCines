import express from 'express';
import cors from 'cors';
import  Movie  from './models/Movie.model.js';
import  Cinema from './models/Cinema.model.js';
import Knex from 'knex';
import { development } from './knexfile.js';
import ShowTiming  from './models/ShowTiming.model.js';
import Timeslot  from './models/Timeslot.model.js';
import moment from 'moment';

// Instanciamos Express y el middleware de JSON y CORS
const app = express();
app.use(express.json());
app.use(cors());

// Conexiones a la base de datos
const dbConnection = Knex(development);
Movie.knex(dbConnection);
Cinema.knex(dbConnection); 
ShowTiming.knex(dbConnection);
Timeslot.knex(dbConnection);

// Endpoint: POST /login --> Inicia sesión
app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) throw err;
      if (!user) res.send('No existe el usuario!');
      else {
        req.logIn(user, (err) => {
          if (err) throw err;
          res.send('Autenticación correcta');
          console.log(req.user);
        });
      }
    })(req, res, next);
  });

// Endpoint: POST /register --> Registra un usuario
app.post("/register", (req, res) => {
    User.findOne({ username: req.body.username }, async (err, doc) => {
      if (err) throw err;
      if (doc) res.send('El usuario ya existe!');
      if (!doc) {
        const newUser = new User({
          username: req.body.username,
          password: req.body.password,
        });
        await newUser.save();
        res.send('Usuario creado!');
      }
    });
  });

// Endpoint: GET /user --> Devuelve info del usuario
app.get("/user", (req, res) => res.send(req.user));

// Endpoint: POST /movies --> Devuelve todas las películas
app.post('/movies', (req, res) => {
    const consulta = Movie.query().throwIfNotFound();
    if (!!req.body && req.body !== {}) {

        // Filtrado por ID
        if (!!req.body.id) consulta.findById(req.body.id);

        // Filtrado por fechas
        if (!!req.body.sessionBefore || !!req.body.sessionAfter) {
            consulta.withGraphJoined('sessions');
            if (!!req.body.sessionBefore) consulta.where('sessions.day', '<=', req.body.sessionBefore);
            if (!!req.body.sessionAfter) consulta.where('sessions.day', '>=', req.body.sessionAfter);
        }

        consulta.then(async results => {
            const finalObject = !!req.body.actors 
                // Filtrado por reparto
                ? results.filter(elem => {
                    const actorsArray = elem.actors.split(',');
                    return actorsArray.every(actor => req.body.actors.includes(actor))
                }) 
                : results;
            if (!!req.body.sessionBefore || !!req.body.sessionAfter) {
                // Formateo de cartelera
                const formattedObject = await Promise.all(finalObject.map(async elem => {
                    return {
                        ...elem,
                        sessions: await Promise.all(elem.sessions.map(async session => {
                            const theaterInfo = await Cinema.query().findById(session.theater_id);
                            const timingInfo = await Timeslot.query().findById(session.timing_id);
                            return {
                                cinema: theaterInfo.name,
                                day: moment(session.day).format('DD/MM/YYYY'),
                                start: timingInfo.start_time,
                                end: timingInfo.end_time,
                            }
                        }))
                    }
                }));
                res.status(200).json(formattedObject);
            } else res.status(200).json(finalObject);
            

        })
    } else Movie.query().then(results => res.status(200).json(results));


});

// Endpoint: POST /cinemas --> Devuelve todos los cines
app.post('/cinemas', (req, res) => {
    const consulta = Cinema.query().throwIfNotFound();
    if (!!req.body && req.body !== {}) {
        // Filtrado por ID
        if (!!req.body.id) consulta.findById(req.body.id);

        // Filtrado por fechas
        if (!!req.body.sessionBefore || !!req.body.sessionAfter || !!req.body.withMovie) {
            consulta.withGraphJoined('sessions');
            if (!!req.body.sessionBefore) consulta.where('sessions.day', '<=', req.body.sessionBefore);
            if (!!req.body.sessionAfter) consulta.where('sessions.day', '>=', req.body.sessionAfter);
            if (!!req.body.withMovie) consulta.where('sessions.movie_id', '=', req.body.withMovie)
        }

        // Con cartelera
        if (!!req.body.withCatalog) {
            consulta.withGraphJoined('catalog.sessions').then(async resp => {
                const responseObject = [resp].flat(); // Solución al bug que se desencadena si resp no es un array
                const finalObject = await Promise.all(responseObject.map(async cinema => {
                    return {
                        ...cinema,
                        catalog: await Promise.all(cinema.catalog.map(async movie => {
                            return {
                                ...movie,
                                sessions: await Promise.all(movie.sessions.filter(movie => movie.theater_id === cinema.id).map(async movie => {
                                    const timetable = await Timeslot.query().findById(movie.timing_id);
                                    return {
                                        date: moment(movie.day).format('DD/MM/YYYY'),
                                        start: timetable.start_time,
                                        end: timetable.end_time
                                    }
                                }))
                            }
                        }))
                    }
                }));
                res.status(200).json(finalObject);
            }).catch(err => res.status(404).json("error"));
        } else {
            consulta.then(results => res.status(200).json(results)).catch(err => res.status(404).json("error"));
        }
    } else Cinema.query().then(results => res.status(200).json(results));
});

// Definimos el puerto 3000 como puerto de escucha y un mensaje de confirmación cuando el servidor esté levantado
app.listen(3000,() => {
    console.log(`Servidor escuchando en el puerto 3000`);
});



