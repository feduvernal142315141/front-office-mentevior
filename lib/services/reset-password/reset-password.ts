
import { ServiceResponse } from "@/lib/models/response"
import { servicePost } from "../baseService"
import {RequestResetPassword} from "@/lib/models/reset-password/reset-password";


export const serviceResetPassword = async (
    data: RequestResetPassword): ServiceResponse<boolean> => {
    return servicePost<RequestResetPassword,boolean>(
        `/member-users/auth/reset-password`,
        data
    )
}
