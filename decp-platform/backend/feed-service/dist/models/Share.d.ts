import { Model, Optional } from 'sequelize';
export interface ShareAttributes {
    id: string;
    postId: string;
    userId: string;
    createdAt?: Date;
}
interface ShareCreationAttributes extends Optional<ShareAttributes, 'id' | 'createdAt'> {
}
declare class Share extends Model<ShareAttributes, ShareCreationAttributes> implements ShareAttributes {
    id: string;
    postId: string;
    userId: string;
    readonly createdAt: Date;
}
export default Share;
//# sourceMappingURL=Share.d.ts.map