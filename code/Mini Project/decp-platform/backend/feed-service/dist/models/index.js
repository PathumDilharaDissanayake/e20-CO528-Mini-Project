"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = exports.Like = exports.Post = void 0;
const Post_1 = __importDefault(require("./Post"));
exports.Post = Post_1.default;
const Like_1 = __importDefault(require("./Like"));
exports.Like = Like_1.default;
const Comment_1 = __importDefault(require("./Comment"));
exports.Comment = Comment_1.default;
// Associations
Post_1.default.hasMany(Like_1.default, { foreignKey: 'postId', as: 'postLikes', onDelete: 'CASCADE' });
Post_1.default.hasMany(Comment_1.default, { foreignKey: 'postId', as: 'postComments', onDelete: 'CASCADE' });
Like_1.default.belongsTo(Post_1.default, { foreignKey: 'postId' });
Comment_1.default.belongsTo(Post_1.default, { foreignKey: 'postId' });
//# sourceMappingURL=index.js.map