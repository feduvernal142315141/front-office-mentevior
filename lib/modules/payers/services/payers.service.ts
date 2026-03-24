import { ApiPayersService } from "./payers-api.service"
import type { PayersServiceContract } from "../types/payers-service.types"

const apiPayersService = new ApiPayersService()

export function getPayersService(): PayersServiceContract {
  return apiPayersService
}
