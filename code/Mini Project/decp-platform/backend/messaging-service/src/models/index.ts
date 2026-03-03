import Conversation from './Conversation';
import Message from './Message';

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

export { Conversation, Message };
