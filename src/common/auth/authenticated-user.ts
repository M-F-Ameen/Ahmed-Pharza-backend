export type AuthenticatedUser = {
  id: string
  email: string
  roleId: string
  permissions: string[]
}

export type AccessTokenPayload = {
  sub: string
  email: string
  roleId: string
  permissions: string[]
}
