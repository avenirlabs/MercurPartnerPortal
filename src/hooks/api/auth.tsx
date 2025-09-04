import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import { UseMutationOptions, useMutation } from "@tanstack/react-query"
import { fetchQuery, sdk } from "../../lib/client"

// Create a custom FetchError if the import doesn't work
class CustomFetchError extends Error {
  status: number
  body: any
  
  constructor(message: string, status: number, body: any) {
    super(message)
    this.status = status
    this.body = body
    this.name = 'FetchError'
  }
}

export const useSignInWithEmailPass = (
  options?: UseMutationOptions<
    | string
    | {
        location: string
      },
    FetchError,
    HttpTypes.AdminSignUpWithEmailPassword
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const apiKey = import.meta.env.VITE_PUBLISHABLE_API_KEY || 'pk_c72299351bae1998e24ec0e9fc6fe27c454752d3c03b69ccf56509e35096a070';
      
      // Use proxy in production to bypass CORS
      const isProduction = window.location.hostname !== 'localhost';
      const apiUrl = isProduction 
        ? `/api/proxy?path=/auth/seller/emailpass`
        : `${import.meta.env.VITE_MEDUSA_BACKEND_URL || 'https://gmbackend.medusajs.app'}/auth/seller/emailpass`;
      
      console.log('Login attempt:', {
        url: apiUrl,
        email: payload.email,
        isProduction
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': apiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Login response:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login error:', errorData);
        
        let errorMessage = errorData.message || 'Login failed';
        
        // Handle specific error cases
        if (errorMessage.includes('not active')) {
          errorMessage = 'Your seller account is pending approval. Please wait for admin activation.';
        } else if (errorMessage.includes('not found')) {
          errorMessage = 'Invalid email or password.';
        }
        
        const error = FetchError ? new FetchError(errorMessage, response.status, errorData) : new CustomFetchError(errorMessage, response.status, errorData);
        throw error;
      }
      
      const result = await response.json();
      console.log('Login success');
      
      // Store token if returned
      if (result && (result.token || typeof result === 'string')) {
        const token = result.token || result;
        window.localStorage.setItem('medusa_auth_token', token);
        console.log('Auth token stored');
      }
      
      return result;
    },
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useSignUpWithEmailPass = (
  options?: UseMutationOptions<
    string,
    FetchError,
    HttpTypes.AdminSignInWithEmailPassword & {
      confirmPassword: string
      name: string
    }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const apiKey = import.meta.env.VITE_PUBLISHABLE_API_KEY || 'pk_c72299351bae1998e24ec0e9fc6fe27c454752d3c03b69ccf56509e35096a070';
      
      // Use proxy in production to bypass CORS
      const isProduction = window.location.hostname !== 'localhost';
      const apiUrl = isProduction 
        ? `/api/proxy?path=/auth/seller/emailpass/register`
        : `${import.meta.env.VITE_MEDUSA_BACKEND_URL || 'https://gmbackend.medusajs.app'}/auth/seller/emailpass/register`;
      
      console.log('Signup attempt:', {
        url: apiUrl,
        apiKey: apiKey.substring(0, 10) + '...',
        isProduction,
        payload: { ...payload, password: '[REDACTED]' }
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': apiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Signup response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Signup error:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const result = await response.json();
      console.log('Signup success, response:', result);
      
      // Store token immediately if returned
      if (result && (result.token || typeof result === 'string')) {
        const token = result.token || result;
        window.localStorage.setItem('medusa_auth_token', token);
        console.log('Auth token stored from registration:', token.substring(0, 20) + '...');
      }
      
      return result;
    },
    onSuccess: async (data, variables) => {
      console.log('Registration successful, creating seller...', { data, variables });
      
      const seller = {
        name: variables.name,
        member: {
          name: variables.name,
          email: variables.email,
        },
      }
      
      console.log('Seller payload:', seller);
      
      try {
        const result = await fetchQuery("/vendor/sellers", {
          method: "POST",
          body: seller,
        })
        console.log('Seller created successfully:', result);
        
        // Store auth token if returned
        if (data && typeof data === 'string') {
          window.localStorage.setItem('medusa_auth_token', data);
          console.log('Auth token stored');
        }
      } catch (error) {
        console.error('Error creating seller - Full details:', {
          error,
          message: error.message,
          stack: error.stack,
          seller
        });
        // Don't throw - let registration succeed even if seller creation fails
      }
    },
    ...options,
  })
}

export const useSignUpForInvite = (
  options?: UseMutationOptions<
    string,
    FetchError,
    HttpTypes.AdminSignInWithEmailPassword
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.auth.register("seller", "emailpass", payload),
    ...options,
  })
}

export const useResetPasswordForEmailPass = (
  options?: UseMutationOptions<void, FetchError, { email: string }>
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.resetPassword("seller", "emailpass", {
        identifier: payload.email,
      }),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useLogout = (options?: UseMutationOptions<void, FetchError>) => {
  return useMutation({
    mutationFn: () => sdk.auth.logout(),
    ...options,
  })
}

export const useUpdateProviderForEmailPass = (
  token: string,
  options?: UseMutationOptions<void, FetchError, { password: string }>
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.updateProvider("seller", "emailpass", payload, token),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
