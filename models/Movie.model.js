import {Model} from 'objection';
import ShowTiming from './ShowTiming.model.js';
import Cinema from './Cinema.model.js';
export default class Movie extends Model {
    
    // Nombre de la tabla
    static tableName = 'movie';

    // Clave primaria
    static idColumn = 'id';

    // Esquema de datos
    static jsonSchema = {
            type: 'object',
            properties: {
                id: {
                    type: 'integer'
                },
                name: {
                    type: 'string',
                    maxLength: 50
                },
                actors: {
                    type: 'string',
                    maxLength: 200
                }
            }
        }
    
    // Relaciones
    static relationMappings = () => ({
        projections: {
            relation: Model.ManyToManyRelation,
            modelClass: Cinema,
            join: {
                from: 'movie.id',
                through: {
                    modelClass: ShowTiming,
                    from: 'show_timing.movie_id',
                    to: 'show_timing.theater_id'
                },
                to: 'theater.id'
            }
        },
        sessions: {
            relation: Model.HasManyRelation,
            modelClass: ShowTiming,
            join: {
                from: 'movie.id',
                to: 'show_timing.movie_id'
            },

        }
    })
}
