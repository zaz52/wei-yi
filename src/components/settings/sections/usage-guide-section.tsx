import { BookOpen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ResourceLink } from "../resource-link"

const GUIDE_LINKS = [
  {
    title: "唯一飞书使用说明",
    description: "打开唯一的飞书说明页，查看安装、模型配置、资料库和小说创作流程。",
    url: "https://gcnwt5c858j4.feishu.cn/wiki/IzVKwG12WiGLlDkKD7Qcy0kGned?from=from_copylink",
    icon: BookOpen,
  },
]

export function UsageGuideSection() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{t("settings.sections.usageGuide.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.sections.usageGuide.description")}
        </p>
      </div>

      <div className="space-y-3">
        {GUIDE_LINKS.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.url} className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <ResourceLink href={item.url} title={item.title}>
                      {t("settings.sections.usageGuide.open")}
                    </ResourceLink>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
