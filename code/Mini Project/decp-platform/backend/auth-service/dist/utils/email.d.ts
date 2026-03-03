export declare const sendEmail: (options: {
    to: string;
    subject: string;
    html: string;
}) => Promise<void>;
export declare const sendVerificationEmail: (email: string, token: string) => Promise<void>;
export declare const sendPasswordResetEmail: (email: string, token: string) => Promise<void>;
//# sourceMappingURL=email.d.ts.map