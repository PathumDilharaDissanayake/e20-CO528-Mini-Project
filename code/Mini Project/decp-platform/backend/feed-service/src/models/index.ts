import Post from './Post';
import Like from './Like';
import Comment from './Comment';
import Share from './Share';
import Bookmark from './Bookmark';

// Associations
Post.hasMany(Like, { foreignKey: 'postId', as: 'postLikes', onDelete: 'CASCADE' });
Post.hasMany(Comment, { foreignKey: 'postId', as: 'postComments', onDelete: 'CASCADE' });
Post.hasMany(Share, { foreignKey: 'postId', as: 'postShares', onDelete: 'CASCADE' });
Post.hasMany(Bookmark, { foreignKey: 'postId', as: 'postBookmarks', onDelete: 'CASCADE' });

Like.belongsTo(Post, { foreignKey: 'postId' });
Comment.belongsTo(Post, { foreignKey: 'postId' });
Share.belongsTo(Post, { foreignKey: 'postId' });
Bookmark.belongsTo(Post, { foreignKey: 'postId' });

export { Post, Like, Comment, Share, Bookmark };
