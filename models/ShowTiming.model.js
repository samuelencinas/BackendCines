import {Model} from 'objection';
import Timeslot from './Timeslot.model.js';
import Cinema  from './Cinema.model.js';
import Movie from './Movie.model.js';
import path, { dirname } from 'path';

export default class ShowTiming extends Model {
    static tableName = 'show_timing';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        properties: {
            id: {
                type: 'integer'
            },
            day: {
                type: 'date'
            },
            theater_id: {
                type: 'integer'
            },
            movie_id: {
                type: 'integer'
            },
            timing_id: {
                type: 'integer'
            }
        }
    };

    static relationMappings = () => ({
        cinemas: {
            relation: Model.BelongsToOneRelation,
            modelClass: Cinema,
            join: {
                from: 'show_timing.theater_id',
                to: 'theater.id'
            }
        },
        movies: {
            relation: Model.BelongsToOneRelation,
            modelClass: Movie,
            join: {
                from: 'show_timing.movie_id',
                to: 'movie.id'
            }
        },
        // Relación TIMETABLE: Para cada show_timing, devuelve la hora de inicio y la hora de fin
        timetable: {
            relation: Model.BelongsToOneRelation,
            modelClass: Timeslot,
            filter: query => query.select('start_time', 'end_time'),
            join: {
                from: 'show_timing.timing_id',
                to: 'timeslot.id'
            }
        }
    });
}
