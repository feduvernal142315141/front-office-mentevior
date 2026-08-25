import { redirect } from "next/navigation"
import { isHiddenNavRoute } from "@/lib/constants/hidden-modules"

export default function DataCollectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isHiddenNavRoute("/data-collection")) {
    redirect("/my-company")
  }

  return children
}
