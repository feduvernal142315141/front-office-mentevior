
import { ServiceResponse } from "@/lib/models/response"
import { servicePost } from "../baseService"
import {RequestForgotPassword} from "@/lib/models/forgot-password/forgot-password";


export const serviceForgotPassword = async (
    data: RequestForgotPassword): ServiceResponse<boolean> => {
    return servicePost<RequestForgotPassword,boolean>(
        `/member-users/auth/forgot-password`,
        data
    )
}
