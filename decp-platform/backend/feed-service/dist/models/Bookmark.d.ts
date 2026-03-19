import { Model, Optional } from 'sequelize';
interface BookmarkAttributes {
    id: string;
    userId: string;
    postId: string;
    createdAt?: Date;
}
declare class Bookmark extends Model<BookmarkAttributes, Optional<BookmarkAttributes, 'id'>> implements BookmarkAttributes {
    id: string;
    userId: string;
    postId: string;
    createdAt: Date;
}
export default Bookmark;
//# sourceMappingURL=Bookmark.d.ts.map