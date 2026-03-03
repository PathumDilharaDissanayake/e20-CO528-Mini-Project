import { Request, Response } from 'express';
export declare const getFeed: (req: Request, res: Response) => Promise<void>;
export declare const createPost: (req: Request, res: Response) => Promise<void>;
export declare const getPost: (req: Request, res: Response) => Promise<void>;
export declare const updatePost: (req: Request, res: Response) => Promise<void>;
export declare const deletePost: (req: Request, res: Response) => Promise<void>;
export declare const likePost: (req: Request, res: Response) => Promise<void>;
export declare const unlikePost: (req: Request, res: Response) => Promise<void>;
export declare const addComment: (req: Request, res: Response) => Promise<void>;
export declare const getComments: (req: Request, res: Response) => Promise<void>;
export declare const deleteComment: (req: Request, res: Response) => Promise<void>;
export declare const sharePost: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=postController.d.ts.map