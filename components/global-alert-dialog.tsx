"use client"

/**
 * ALERT DIALOG GLOBAL
 * 
 * Muestra alerts críticos controlados por el InterceptorContext.
 * Se usa para errores HTTP importantes (401, 403, 500, etc.)
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAlerts } from '@/lib/contexts/interceptor-context'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

export function GlobalAlertDialog() {
  const { alertDialog, closeAlert } = useAlerts()

  // Seleccionar el ícono según el tipo
  const Icon = 
    alertDialog.type === 'error' ? AlertCircle :
    alertDialog.type === 'warning' ? AlertTriangle :
    Info

  // Color del ícono según el tipo
  const iconColor =
    alertDialog.type === 'error' ? 'text-red-600' :
    alertDialog.type === 'warning' ? 'text-yellow-600' :
    'text-blue-600'

  return (
    <AlertDialog open={alertDialog.isOpen} onOpenChange={closeAlert}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 flex-shrink-0 ${iconColor}`} />
            <AlertDialogTitle className="text-gray-900 dark:text-white text-left">
              {alertDialog.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-left">
            {alertDialog.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex justify-end">
          <AlertDialogAction 
            onClick={closeAlert}
            style={{ 
              backgroundColor: '#037ECC',
              color: 'white',
            }}
            className="hover:bg-[#0262A2] font-semibold px-8 py-2.5 rounded-lg min-w-[100px] transition-colors"
          >
            Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

