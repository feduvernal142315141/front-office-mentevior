import { MockPayersService } from "./payers-mock.service"
import type { PayersServiceContract } from "../types/payers-service.types"

const mockPayersService = new MockPayersService()

export function getPayersService(): PayersServiceContract {
  // TODO: Replace with backend adapter when API is available.
  // Example: return process.env.NEXT_PUBLIC_PAYERS_DATA_SOURCE === "api"
  //   ? new ApiPayersService()
  //   : mockPayersService
  return mockPayersService
}
