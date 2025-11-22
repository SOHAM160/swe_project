// Authentication utilities

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'contractor' | 'citizen';
  name?: string;
  email?: string;
}

// Hardcoded credentials for admin and contractor
const CREDENTIALS = {
  admin: { username: 'sde', password: '123' },
  contractor: { username: 'sde', password: '123' },
};

export function loginAdmin(username: string, password: string): boolean {
  return username === CREDENTIALS.admin.username && password === CREDENTIALS.admin.password;
}

export function loginContractor(username: string, password: string): boolean {
  return username === CREDENTIALS.contractor.username && password === CREDENTIALS.contractor.password;
}

export function setAuthUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user));
  }
}

export function getAuthUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('authUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
  }
  return null;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser');
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function requireAuth(role?: 'admin' | 'contractor' | 'citizen'): User | null {
  const user = getAuthUser();
  if (!user) return null;
  if (role && user.role !== role) return null;
  return user;
}

