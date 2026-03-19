import Event from './Event';
import RSVP from './RSVP';

Event.hasMany(RSVP, { foreignKey: 'eventId', as: 'rsvps', onDelete: 'CASCADE' });
RSVP.belongsTo(Event, { foreignKey: 'eventId' });

export { Event, RSVP };
