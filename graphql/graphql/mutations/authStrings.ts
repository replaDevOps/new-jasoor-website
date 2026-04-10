/**
 * auth.ts
 *
 * GraphQL mutations for authentication.
 * Field names and variable names mirror OLD frontend exactly.
 */

// We import gql lazily via a helper so this file works before
// @apollo/client is resolved at module load time.
// The actual tag function is exported from apolloClient.
export const AUTH_MUTATIONS = {
  LOGIN: `
    mutation Login($password: String!, $email: String) {
      login(password: $password, email: $email) {
        token
        refreshToken
        user {
          id
          status
        }
      }
    }
  `,

  REFRESH_TOKEN: `
    mutation RefreshToken($token: String!) {
      refreshToken(token: $token) {
        token
        refreshToken
        user {
          id
          status
        }
      }
    }
  `,

  CREATE_USER: `
    mutation CreateUser($input: UserInput!) {
      createUser(input: $input) {
        token
        refreshToken
        user {
          id
          status
        }
      }
    }
  `,

  VERIFY_EMAIL: `
    mutation VerifyEmail($email: String!) {
      verifyEmail(email: $email)
    }
  `,

  VERIFY_EMAIL_OTP: `
    mutation VerifyEmailOTP($email: String!, $otp: String!) {
      verifyEmailOTP(email: $email, otp: $otp) {
        message
        success
      }
    }
  `,

  LOGOUT: `
    mutation Logout {
      logout {
        message
      }
    }
  `,

  CHANGE_PASSWORD: `
    mutation AdminChangePassword(
      $adminChangePasswordId: ID
      $oldPassword: String
      $newPassword: String
    ) {
      adminChangePassword(
        id: $adminChangePasswordId
        oldPassword: $oldPassword
        newPassword: $newPassword
      )
    }
  `,

  REQUEST_PASSWORD_RESET: `
    mutation RequestPasswordReset($email: String!) {
      requestPasswordReset(email: $email) {
        success
        message
      }
    }
  `,

  VERIFY_PASSWORD_RESET_OTP: `
    mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {
      verifyPasswordResetOTP(email: $email, otp: $otp) {
        success
        message
        resetToken
      }
    }
  `,

  RESET_PASSWORD_WITH_TOKEN: `
    mutation ResetPasswordWithToken($resetToken: String!, $newPassword: String!) {
      resetPasswordWithToken(resetToken: $resetToken, newPassword: $newPassword) {
        success
        message
      }
    }
  `,
};
