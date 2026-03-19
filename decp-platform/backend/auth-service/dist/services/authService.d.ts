/**
 * Auth Service — Business logic layer for auth-service.
 * Extracted from authController.ts for testability and SRP compliance.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Date: 2026-03-03
 */
export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    graduationYear?: number;
}
export interface AuthResult {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isEmailVerified: boolean;
        profilePicture?: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export declare const register: (input: RegisterInput) => Promise<AuthResult>;
export declare const login: (email: string, password: string) => Promise<AuthResult>;
export declare const refreshTokens: (token: string) => Promise<Omit<AuthResult, "user">>;
export declare const logout: (token?: string) => Promise<void>;
export declare const verifyEmail: (token: string) => Promise<void>;
export declare const forgotPassword: (email: string) => Promise<void>;
export declare const resetPassword: (token: string, newPassword: string) => Promise<void>;
//# sourceMappingURL=authService.d.ts.map