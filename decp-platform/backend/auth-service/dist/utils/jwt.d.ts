export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}
export declare const generateAccessToken: (payload: TokenPayload) => string;
export declare const generateRefreshToken: (payload: TokenPayload) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export declare const generateTokens: (payload: TokenPayload) => {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
};
//# sourceMappingURL=jwt.d.ts.map