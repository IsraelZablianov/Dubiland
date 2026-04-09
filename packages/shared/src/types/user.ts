export interface Family {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  avatar: string;
  theme: string;
  birthDate: string | null;
  createdAt: string;
}
