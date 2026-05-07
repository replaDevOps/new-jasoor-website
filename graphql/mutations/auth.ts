/**
 * auth.ts — GraphQL Auth Mutations
 *
 * Mirrors OLD frontend src/graphql/mutation/login.js exactly.
 * All operation names, variable names, and response fields are identical.
 */

import { gql } from '@apollo/client';

export const LOGIN = gql`
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
`;

export const REFRESH_TOKEN = gql`
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
`;

export const CREATE_USER = gql`
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
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($email: String!) {
    verifyEmail(email: $email)
  }
`;

export const VERIFY_EMAIL_OTP = gql`
  mutation VerifyEmailOTP($email: String!, $otp: String!) {
    verifyEmailOTP(email: $email, otp: $otp) {
      message
      success
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;

export const CHANGE_PASSWORD = gql`
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
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

export const VERIFY_PASSWORD_RESET_OTP = gql`
  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {
    verifyPasswordResetOTP(email: $email, otp: $otp) {
      success
      message
      resetToken
    }
  }
`;

export const RESET_PASSWORD_WITH_TOKEN = gql`
  mutation ResetPasswordWithToken($resetToken: String!, $newPassword: String!) {
    resetPasswordWithToken(resetToken: $resetToken, newPassword: $newPassword) {
      success
      message
    }
  }
`;
