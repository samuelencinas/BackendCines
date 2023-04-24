import {Model} from 'objection'
import bcrypt from 'bcryptjs'

export default class User extends Model {
  static tableName = 'User';

  static jsonSchema = {
    type: 'object',
    required: ['username'],

    properties: {
      id: {type: 'integer'},
      name: {type: 'string'},
      username: {type: 'string', default: ''},
      hash: {type: 'string'},
      isAdmin: {type: 'boolean', default: false},
      isSeller: {type: 'boolean', default: false},
      permissions: {type: 'array'},
      created_at: {},
      updated_at: {}
    }
  };

  set password (password) {
    this.hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10))
  };

  verifyPassword (password, callback) {
    bcrypt.compare(password, this.hash, callback)
  };

}