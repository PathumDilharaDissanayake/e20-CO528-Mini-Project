import Post from './Post';
import Like from './Like';
import Comment from './Comment';

// Associations
Post.hasMany(Like, { foreignKey: 'postId', as: 'postLikes', onDelete: 'CASCADE' });
Post.hasMany(Comment, { foreignKey: 'postId', as: 'postComments', onDelete: 'CASCADE' });

Like.belongsTo(Post, { foreignKey: 'postId' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

export { Post, Like, Comment };
