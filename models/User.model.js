import {Model} from 'objection'
import bcrypt from 'bcryptjs'

export default class User extends Model {
  static tableName = 'users';

  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['user'],

    properties: {
      user: {type: 'string', default: ''},
      password: {type: 'string'}
    }
  };

  set unsecurePassword (unsecurePassword) {
    this.password = bcrypt.hashSync(unsecurePassword, bcrypt.genSaltSync(10))
  };

  verifyPassword (unsecurePassword, callback) {
    return bcrypt.compare(String(unsecurePassword), String(this.password), callback)
  };

}