# Authentication Pages

Beautiful authentication pages built with shadcn/ui components that match your Zynex AI Studio theme.

## Pages Included

- **Login** (`/auth/login`) - Sign in with email/password
- **Sign Up** (`/auth/signup`) - Create new account
- **Forgot Password** (`/auth/forgot-password`) - Request password reset
- **Reset Password** (`/auth/reset-password`) - Set new password with token

## Features

- 🎨 Matches your existing theme (stone base color, modern styling)
- 📱 Fully responsive design
- ✨ Beautiful animations and transitions
- 🔒 Form validation and error handling
- 👁️ Password visibility toggle
- 💪 Password strength indicator (reset page)
- ♿ Accessible components
- 🌙 Dark/light mode support

## Components

- `AuthLayout` - Shared layout wrapper
- `AuthInput` - Enhanced input component with icons and validation
- `LoginForm` - Login form with validation
- `SignupForm` - Signup form with validation
- `ForgotPasswordForm` - Forgot password form
- `ResetPasswordForm` - Reset password form with strength indicator

## Usage

The pages are already set up and accessible at:
- `/auth/login`
- `/auth/signup` 
- `/auth/forgot-password`
- `/auth/reset-password`

## Demo Credentials

For the login demo, use:
- Email: `demo@example.com`
- Password: `password`

## Customization

To integrate with your authentication provider (Supabase):

1. Replace the TODO comments in form components with actual API calls
2. Update the success/error handling logic
3. Add proper token validation for password reset

## Styling

The components use your existing design system:
- CSS variables from `globals.css`
- shadcn/ui components
- Tailwind CSS classes
- Consistent with your app's theme
