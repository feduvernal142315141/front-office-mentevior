"use client"

import { ArrowLeft, X } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
} from "@/components/ui/drawer"
import { SelectSourceStep } from "./SelectSourceStep"
import { SearchCatalogStep } from "./SearchCatalogStep"
import { useHRDocumentDrawer } from "../hooks/useHRDocumentDrawer"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface HRDocumentDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function HRDocumentDrawer({ isOpen, onClose, onSuccess }: HRDocumentDrawerProps) {
  const {
    currentStep,
    reset,
    selectSource,
    goBack,
  } = useHRDocumentDrawer()

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSuccess = () => {
    reset()
    onSuccess()
  }

  const canGoBack = currentStep !== "select-source"
  
  const getStepTitle = () => {
    switch (currentStep) {
      case "select-source":
        return "Add HR Document"
      case "search-catalog":
        return "Search Catalog"
      default:
        return "HR Document"
    }
  }

  return (
    <Drawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      direction="right"
    >
      <DrawerContent className="w-full sm:max-w-2xl bg-white shadow-2xl">
        <VisuallyHidden>
          <DrawerTitle>{getStepTitle()}</DrawerTitle>
        </VisuallyHidden>

        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {canGoBack && (
                <button
                  onClick={goBack}
                  className="
                    p-2 rounded-lg
                    hover:bg-gray-100
                    transition-colors
                  "
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {getStepTitle()}
              </h2>
            </div>

            <DrawerClose asChild>
              <button
                className="
                  p-2 rounded-lg
                  hover:bg-gray-100
                  transition-colors
                "
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </DrawerClose>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden bg-white">
          {currentStep === "select-source" && (
            <SelectSourceStep 
              onSelectSource={selectSource}
              onClose={handleClose}
            />
          )}

          {currentStep === "search-catalog" && (
            <SearchCatalogStep 
              onSuccess={handleSuccess}
              onClose={handleClose}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
