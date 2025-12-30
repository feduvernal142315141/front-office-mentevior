import { Button } from "@/components/custom/Button"
import { CheckCircle2, Clock } from "lucide-react"

interface UserSuccessScreenProps {
  email: string
  countdown: number
  onCreateAnother: () => void
  onGoToList: () => void
}

export function UserSuccessScreen({
  email,
  countdown,
  onCreateAnother,
  onGoToList,
}: UserSuccessScreenProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Alert */}
      <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-green-900 font-semibold text-lg mb-2">
              User Created Successfully!
            </h4>
            <p className="text-green-800 text-sm mb-3">
              The user has been created and a welcome email has been sent to:
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-green-200">
              <span className="font-mono font-semibold text-green-900">{email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-redirect Alert */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h5 className="text-blue-900 font-semibold text-sm mb-1">
              Auto-redirect
            </h5>
            <p className="text-blue-800 text-sm">
              Redirecting to users list in{" "}
              <span className="font-bold text-blue-900">{countdown}</span> seconds...
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button 
          variant="ghost" 
          onClick={onCreateAnother} 
          className="flex-1"
        >
          Create Another User
        </Button>
        <Button 
          variant="primary" 
          onClick={onGoToList} 
          className="flex-1"
        >
          Go to Users List
        </Button>
      </div>
    </div>
  )
}
