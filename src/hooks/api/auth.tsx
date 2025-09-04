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
      console.log('Registration successful, now logging in to create seller...', { data, variables });
      
      // First, log in to get the auth token
      try {
        const apiKey = import.meta.env.VITE_PUBLISHABLE_API_KEY || 'pk_c72299351bae1998e24ec0e9fc6fe27c454752d3c03b69ccf56509e35096a070';
        const isProduction = window.location.hostname !== 'localhost';
        const loginUrl = isProduction 
          ? `/api/proxy?path=/auth/seller/emailpass`
          : `${import.meta.env.VITE_MEDUSA_BACKEND_URL || 'https://gmbackend.medusajs.app'}/auth/seller/emailpass`;
        
        console.log('Logging in to get auth token...');
        const loginResponse = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': apiKey,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: variables.email,
            password: variables.password
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          const token = loginData.token || loginData;
          
          if (token) {
            window.localStorage.setItem('medusa_auth_token', token);
            console.log('Auth token obtained and stored');
            
            // Now create the seller with the auth token
            const seller = {
              name: variables.name,
              member: {
                name: variables.name,
                email: variables.email,
              },
            }
            
            console.log('Creating seller with auth token...', seller);
            
            const sellerUrl = isProduction 
              ? `/api/proxy?path=/vendor/sellers`
              : `${import.meta.env.VITE_MEDUSA_BACKEND_URL || 'https://gmbackend.medusajs.app'}/vendor/sellers`;
            
            const sellerResponse = await fetch(sellerUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': apiKey,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              },
              body: JSON.stringify(seller)
            });
            
            if (sellerResponse.ok) {
              const sellerData = await sellerResponse.json();
              console.log('Seller created successfully:', sellerData);
            } else {
              const errorText = await sellerResponse.text();
              console.error('Failed to create seller:', sellerResponse.status, errorText);
            }
          }
        } else {
          console.log('Login after registration failed - seller may not be active yet');
        }
      } catch (error) {
        console.error('Error in post-registration process:', error);
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
