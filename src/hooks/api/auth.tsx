import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import { UseMutationOptions, useMutation } from "@tanstack/react-query"
import { fetchQuery, sdk } from "../../lib/client"

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
    mutationFn: (payload) => sdk.auth.login("seller", "emailpass", payload),
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
      // Use environment variables with fallbacks
      const backendUrl = __BACKEND_URL__ || 'https://gmbackend.medusajs.app';
      const apiKey = __PUBLISHABLE_API_KEY__ || 'pk_c72299351bae1998e24ec0e9fc6fe27c454752d3c03b69ccf56509e35096a070';
      
      console.log('Signup attempt:', {
        url: `${backendUrl}/auth/seller/emailpass/register`,
        apiKey: apiKey.substring(0, 10) + '...',
        payload: { ...payload, password: '[REDACTED]' }
      });
      
      const response = await fetch(`${backendUrl}/auth/seller/emailpass/register`, {
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
      console.log('Signup success');
      return result;
    },
    onSuccess: async (_, variables) => {
      const seller = {
        name: variables.name,
        member: {
          name: variables.name,
          email: variables.email,
        },
      }
      
      try {
        await fetchQuery("/vendor/sellers", {
          method: "POST",
          body: seller,
        })
        console.log('Seller created successfully');
      } catch (error) {
        console.error('Error creating seller:', error);
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
