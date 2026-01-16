export interface User {
  userID: string
  firstName: string
  lastName: string
  email: string
  password: string
  created: Date
  lastUpdated: Date
  phoneNumber: string | null
  validated: boolean
}

export type UserWithoutPassword = Omit<User, 'password'>
