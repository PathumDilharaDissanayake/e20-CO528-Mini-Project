"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bookmark = exports.Share = exports.Comment = exports.Like = exports.Post = void 0;
const Post_1 = __importDefault(require("./Post"));
exports.Post = Post_1.default;
const Like_1 = __importDefault(require("./Like"));
exports.Like = Like_1.default;
const Comment_1 = __importDefault(require("./Comment"));
exports.Comment = Comment_1.default;
const Share_1 = __importDefault(require("./Share"));
exports.Share = Share_1.default;
const Bookmark_1 = __importDefault(require("./Bookmark"));
exports.Bookmark = Bookmark_1.default;
// Associations
Post_1.default.hasMany(Like_1.default, { foreignKey: 'postId', as: 'postLikes', onDelete: 'CASCADE' });
Post_1.default.hasMany(Comment_1.default, { foreignKey: 'postId', as: 'postComments', onDelete: 'CASCADE' });
Post_1.default.hasMany(Share_1.default, { foreignKey: 'postId', as: 'postShares', onDelete: 'CASCADE' });
Post_1.default.hasMany(Bookmark_1.default, { foreignKey: 'postId', as: 'postBookmarks', onDelete: 'CASCADE' });
Like_1.default.belongsTo(Post_1.default, { foreignKey: 'postId' });
Comment_1.default.belongsTo(Post_1.default, { foreignKey: 'postId' });
Share_1.default.belongsTo(Post_1.default, { foreignKey: 'postId' });
Bookmark_1.default.belongsTo(Post_1.default, { foreignKey: 'postId' });
//# sourceMappingURL=index.js.map