import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Lecture } from "@/lib/types"

export function LectureCard({ lecture }: { lecture: Lecture }) {
  return (
    <Link href={`/lecture/${lecture.id}`}>
      <Card className="bg-[#1e1e2e] border-[#313244] hover:border-[#585b70] transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#cdd6f4] text-base">{lecture.title}</CardTitle>
            {lecture.is_default && (
              <Badge className="bg-[#313244] text-[#89b4fa] text-xs">
                По умолчанию
              </Badge>
            )}
          </div>
          <CardDescription className="text-[#6c7086] font-mono text-xs">
            {lecture.filename}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
