import express from 'express';
import cors from 'cors';
import  Movie  from './models/Movie.model.js';
import  Cinema from './models/Cinema.model.js';
import Knex from 'knex';
import User from './models/User.model.js';
import { development } from './knexfile.js';
import ShowTiming  from './models/ShowTiming.model.js';
import Timeslot  from './models/Timeslot.model.js';
import session from 'express-session';
import moment from 'moment';
import passport from 'passport';
import { strategyInit } from './lib/AuthStrategy.js';

// Instanciamos Express y el middleware de JSON y CORS
const app = express();
app.use(express.json());
app.use(cors());

// Inicialización del sistema de sesiones (adelantando temario del siguiente lab)
app.use(session({
    secret: 'cines-session-cookie-key', // Secreto de la sesión (puede ser cualquier identificador unívoco de la app, esto no es público al usuario)
    name: 'SessionCookie.SID', // Nombre de la sesión
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 3600000, // Expiración de la sesión
    },
}));
app.use(passport.initialize()); // passport.initialize() inicializa Passport
app.use(passport.session()); // passport.session() indica a Passport que usará sesiones
strategyInit(passport);

// Conexiones a la base de datos
const dbConnection = Knex(development);
Movie.knex(dbConnection);
Cinema.knex(dbConnection); 
ShowTiming.knex(dbConnection);
Timeslot.knex(dbConnection);
User.knex(dbConnection);

/**
 * ENDPOINT: POST /login --> Inicia sesión
 * 
 * Si os dais cuenta, declaramos el endpoint metiendo passport.authenticate('local') como middleware 
 * y después ya la lógica (que ocurrirá después del authenticate)
 * 
 * Para más info del authenticate ver el archivo LocalStrategy.js
 */
app.post('/login', passport.authenticate('local'), (req, res) => {
    if (!!req.user) res.status(200).json({status: 'OK'})
    else res.status(500).json({status: "Sesión no iniciada"});
});



/**
 * ENDPOINT: POST /register --> Registra un usuario
 * 
 * Para registrar un usuario bastará con comprobar si existe y, si no existe, insertarlo en la base de datos.
 * Para ello, podemos reciclar la query inicial añadiendo el método "insert"
 * 
 * El método findOne de objection es el equivalente a .where('columna', '=', valor).first(), pero simplificado
 * Nota: Para poder llamar a findOne de este modo (recibiendo un JSON como parámetro), es preciso haber definido el JSONSchema en el modelo del Usuario
 */
app.post("/register", (req, res) => {
    const dbQuery = User.query();
    dbQuery.findOne({user: req.body.user}).then(async result => {
        if (!!result) res.status(500).json({error: "El usuario ya existe"});
        else {
            dbQuery.insert({
                user: req.body.user,
                unsecurePassword: String(req.body.password)
            }).then(insertResult => {
                debugger;
            }).catch(error => {
                debugger;
            })
        }

    })
  });

// Endpoint: GET /user --> Devuelve info del usuario en la sesión actual (y un 401 si no se ha iniciado sesión)
app.get("/user", (req, res) => !!req.isAuthenticated() ? res.status(200).send(req.session) : res.status(401).send('Sesión no iniciada!'));

// Endpoint: 
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
app.listen(8080,() => {
    console.log(`Servidor escuchando en el puerto 8080`);
});



