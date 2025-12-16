"use client";

import React, {createContext, useContext, useState, ReactNode} from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";

type AlertType = "confirm" | "success" | "error";

interface AlertState {
    type: AlertType;
    title: string;
    description?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface AlertContextType {
    showConfirm: (options: Omit<AlertState, "type">) => void;
    showSuccess: (title: string, description?: string) => void;
    showError: (title: string, description?: string) => void;
    close: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({children}: { children: ReactNode }) {
    const [alert, setAlert] = useState<AlertState | null>(null);

    const showConfirm = (options: Omit<AlertState, "type">) =>{
        setAlert({...options, type: "confirm"});
        setTimeout(() => {
                close()
            }
            , 15000)
    }

    const showSuccess = (title: string, description?: string) => {

        setAlert({type: "success", title, description});
        setTimeout(() => {
                close()
            }
            , 5000)
    }

    const showError = (title: string, description?: string) => {
        setAlert({type: "error", title, description});
        setTimeout(() => {
                close()
            }
            , 5000)
    }

    const close = () => setAlert(null);

    return (
        <AlertContext.Provider value={{showConfirm, showSuccess, showError, close}}>
            {children}
            <AlertDialog open={!!alert} onOpenChange={close}>
                <AlertDialogContent
                    className="
          animate-enterprise-scale
          max-w-sm w-full
          rounded-xl 
          border border-border-hairline/40
          bg-surface-primary/80 
          dark:bg-surface-primary/60
          backdrop-blur-md
          shadow-[0_4px_24px_rgba(0,0,0,0.25)]
          dark:shadow-[0_4px_24px_rgba(0,0,0,0.55)]
          px-6 py-5
          space-y-4
        "
                >
                    {/* ICONO */}
                    <div className="flex justify-center">
                        {alert?.type === "success" && (
                            <div
                                className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-lg">
                                ✓
                            </div>
                        )}

                        {alert?.type === "error" && (
                            <div
                                className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-lg">
                                ✕
                            </div>
                        )}

                        {alert?.type === "confirm" && (
                            <div
                                className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-600 flex items-center justify-center text-lg">
                                !
                            </div>
                        )}
                    </div>

                    {/* TITULO */}
                    <AlertDialogTitle className="text-center text-lg font-semibold">
                        {alert?.title}
                    </AlertDialogTitle>

                    {/* DESCRIPCION */}
                    {alert?.description && (
                        <AlertDialogDescription className="text-center text-sm text-text-secondary">
                            {alert.description}
                        </AlertDialogDescription>
                    )}

                    {/* ACCIONES */}
                    <div className="flex justify-end gap-2 mt-3">

                        {alert?.type === "confirm" ? (
                            <>
                                <AlertDialogCancel
                                    className="
                  px-4 py-2 rounded-md text-sm
                  bg-surface-secondary dark:bg-surface-secondary/50
                  text-text-secondary
                  border border-border-hairline/40
                  hover:bg-surface-secondary/80
                  transition
                "
                                >
                                    {alert.cancelText ?? "Cancel"}
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    onClick={() => {
                                        alert.onConfirm?.();
                                        close();
                                    }}
                                    className="
                  px-5 py-2 text-sm rounded-md font-medium
                  bg-accent-primary hover:bg-accent-hover 
                  text-white shadow
                  transition
                "
                                >
                                    {alert.confirmText ?? "Confirm"}
                                </AlertDialogAction>
                            </>
                        ) : (
                            <Button
                                onClick={close}
                                className="
                px-5 py-2 text-sm rounded-md font-medium
                bg-accent-primary hover:bg-accent-hover 
                text-white shadow
                transition
              "
                            >
                                OK
                            </Button>
                        )}
                    </div>
                </AlertDialogContent>

            </AlertDialog>
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) throw new Error("useAlert must be used within AlertProvider");
    return context;
}
