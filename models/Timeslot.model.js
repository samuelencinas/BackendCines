import {Model} from 'objection';

export default class Timeslot extends Model {
    static tableName = 'timeslot';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        properties: {
            id: {
                type: 'integer'
            },
            start_time: {
                type: 'string',
                maxLength: 5
            },
            end_time: {
                type: 'string',
                maxLength: 5
            }
        }
    };

}

