
export interface RequestUpdatePassword {
  memberUserId: string;
  oldPassword: string;
  newPassword: string;
}