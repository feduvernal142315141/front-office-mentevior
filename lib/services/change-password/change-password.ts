import { ServiceResponse } from "@/lib/models/response"
import { RequestUpdatePassword } from "@/lib/models/change-password/change-password"
import apiInstance from "../apiConfig"
import { ResponseEntity } from "@/lib/models/response"

export const serviceUpdatePassword = async (
  data: RequestUpdatePassword
): ServiceResponse<string> => {
  return apiInstance
    .put<ResponseEntity<string>>(`/member-users/change-password`, data)
}
