
import type { MemberUser, CreateMemberUserDto, CreateMemberUserResponse, UpdateMemberUserDto } from "@/lib/types/user.types"
import type { Role } from "@/lib/types/role.types"
import { mockUsers, getMockActiveUsers } from "@/lib/mocks/users.mock"
import { getMockActiveRoles } from "@/lib/mocks/roles.mock"

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function getUsers(): Promise<MemberUser[]> {
  await delay(500) 
  return getMockActiveUsers()
}

export async function createUser(data: CreateMemberUserDto): Promise<CreateMemberUserResponse> {
  await delay(800) 
  

  const existingUser = mockUsers.find(u => u.email === data.email)
  if (existingUser) {
    throw new Error("Email already exists")
  }
  

  const newUser: MemberUser = {
    id: `user-${Date.now()}`,
    ...data,
    isActive: true,
  }
  
  mockUsers.push(newUser)
  
  const tempPassword = generateTempPassword()
  
  return {
    id: newUser.id,
    email: newUser.email,
  }
}

export async function getRoles(): Promise<Role[]> {
  await delay(300)
  return getMockActiveRoles()
}


export async function getUserById(id: string): Promise<MemberUser | null> {
  await delay(300)
  return mockUsers.find(u => u.id === id) || null
}

export async function updateUser(id: string, data: UpdateMemberUserDto): Promise<MemberUser> {
  await delay(800) 
  
  const userIndex = mockUsers.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    throw new Error("User not found")
  }
  
 
  if (data.email && data.email !== mockUsers[userIndex].email) {
    const emailExists = mockUsers.some(u => u.email === data.email && u.id !== id)
    if (emailExists) {
      throw new Error("Email already exists")
    }
  }
  

  const updatedUser: MemberUser = {
    ...mockUsers[userIndex],
    ...data,
  }
  
  mockUsers[userIndex] = updatedUser
  
  return updatedUser
}
