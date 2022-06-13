import Realm from 'realm'

class History extends Realm.Object {}
History.schema = {
  name: 'History',
  properties: {
    _id: 'uuid',
    position: 'string?',
    battery: 'string?',

    actionDate: 'date?',

    createdAt: { type: 'date?', default: new Date() },
  },
  primaryKey: '_id',
}

export default new Realm({ schema: [History] })
