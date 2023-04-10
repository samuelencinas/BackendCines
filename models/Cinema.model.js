import {Model} from 'objection';
import Movie from './Movie.model.js';
import ShowTiming from './ShowTiming.model.js';
export default class Cinema extends Model {
    // Nombre de la tabla
    static tableName = 'theater'; 

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
            capacity: {
                type: 'integer',
            }
        }
    }

    static relationMappings = () => ({        
        // Relación CARTELERA --> Para cada cine, devuelve la propiedad "catalog" con la cartelera de ese cine
        catalog: {
            relation: Model.ManyToManyRelation,
            modelClass: Movie,
            join: {
                from: 'theater.id',
                through: {
                    modelClass: ShowTiming,
                    from: 'show_timing.theater_id',
                    to: 'show_timing.movie_id',
                },
                to: 'movie.id',
            },
        },
        sessions: {
            relation: Model.HasManyRelation,
            modelClass: ShowTiming,
            join: {
                from: 'theater.id',
                to: 'show_timing.theater_id',
            }
        }});
}
