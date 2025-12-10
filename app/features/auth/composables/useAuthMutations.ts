import type {
  ForgotPasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
} from '../types/auth.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { authApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useLogin = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: (credentials: LoginCredentials) => authApi.login(credentials),
    onSettled: () => {
      queryCache.invalidateQueries({ key: authKeys.session() })
    },
  })
}

export const useRegister = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSettled: () => {
      queryCache.invalidateQueries({ key: authKeys.session() })
    },
  })
}

export const useLogout = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: () => authApi.logout(),
    onSettled: () => {
      queryCache.invalidateQueries({ key: authKeys.session() })
    },
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutation: (credentials: ForgotPasswordCredentials) => authApi.forgotPassword(credentials),
  })
}

export const useResetPassword = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: (credentials: ResetPasswordCredentials) => authApi.resetPassword(credentials),
    onSettled: () => {
      queryCache.invalidateQueries({ key: authKeys.session() })
    },
  })
}
