import { Request, Response } from 'express';
export declare const getUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUserById: (req: Request, res: Response) => Promise<void>;
export declare const getMyProfile: (req: Request, res: Response) => Promise<void>;
export declare const updateProfile: (req: Request, res: Response) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
export declare const searchUsers: (req: Request, res: Response) => Promise<void>;
export declare const getConnections: (req: Request, res: Response) => Promise<void>;
export declare const followUser: (req: Request, res: Response) => Promise<void>;
export declare const acceptConnection: (req: Request, res: Response) => Promise<void>;
export declare const declineConnection: (req: Request, res: Response) => Promise<void>;
export declare const getConnectionRequests: (req: Request, res: Response) => Promise<void>;
export declare const unfollowUser: (req: Request, res: Response) => Promise<void>;
export declare const endorseSkill: (req: Request, res: Response) => Promise<void>;
export declare const getConnectionStatus: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map