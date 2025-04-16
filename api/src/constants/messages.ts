export const Messages = {
  auth: {
    USER_CREATED: "User created successfully",
    USER_EXISTS: "User already exists",
    WRONG_PASSWORD: "Wrong password",
    SET_DIFF_PASSWORD: "Set a new password other than you old.",
    INVALID_CREDENTIALS: "Invalid email or password",
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    PASSWORD_UPDATE_SUCCESS: "Password reset successful",
    USER_NOT_FOUND: "User not found",
    USER_ID_NOT_PROVIDED: "User ID not provided",
  },
  common: {
    UNAUTHORIZED: "Unauthorized access",
    SERVER_ERROR: "Internal server error",
    VALIDATION_ERROR: "Validation failed",
    REQUIRED_DATA: "Required data not provided",
  },
  token: {
    TOKEN_MISSING: "Access token missing",
    TOKEN_EXPIRED: "Invalid or expired token",
    TOKEN_INVALID_REUSED: "Invalid or reused token",
    TOKEN_VALID: "Token is valid",
    TOKEN_INVALID: "Token is invalid",
    REFRESH_TOKEN_INVALID: "Refresh token is invalid",
  },
} as const;
