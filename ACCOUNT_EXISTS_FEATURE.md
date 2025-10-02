# Account Already Exists Feature

This feature handles the case when a user tries to sign up with an email that already has an account.

## How it works

When a user attempts to sign up with an email that already exists, Supabase's behavior depends on your project's email confirmation settings:

### Case 1: Email confirmation is enabled (default)
- Supabase returns a response with `data.user` but `data.session` is `null`
- The `data.user.identities` array is empty, indicating an existing user
- No error is thrown

### Case 2: Email confirmation is disabled  
- Supabase returns an error with the message "User already registered"

## Implementation

The `AuthForm` component now handles both cases:

1. **Checks the response structure** for obfuscated user objects (Case 1)
2. **Catches and identifies** "User already registered" errors (Case 2)
3. **Shows a friendly message** instead of confusing error text
4. **Provides a "Switch to Sign In" button** for better UX

## User Experience

When a user tries to sign up with an existing email:

1. Instead of showing a cryptic error or success message
2. Shows: "An account with this email already exists."
3. Provides a button: "Switch to Sign In"
4. Clicking the button toggles the form to sign-in mode
5. The email field retains the user's input for convenience

## Testing

The feature includes comprehensive tests covering:
- Obfuscated response handling (email confirmation enabled)
- Error response handling (email confirmation disabled)  
- UI interaction with the "Switch to Sign In" button
- Form mode toggling functionality

All tests pass successfully! ✅