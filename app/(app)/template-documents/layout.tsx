import { redirect } from "next/navigation"
import { isHiddenNavRoute } from "@/lib/constants/hidden-modules"

export default function TemplateDocumentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isHiddenNavRoute("/template-documents")) {
    redirect("/my-company")
  }

  return children
}
