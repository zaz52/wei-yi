import { useState, useEffect } from "react"
import {
  FileText, FolderOpen, Search, Network, Brain, Settings, ArrowLeftRight, Sun, Moon, Monitor, Trash2, Sparkles, LayoutDashboard,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useWikiStore } from "@/stores/wiki-store"
import { useReviewStore } from "@/stores/review-store"
import { useTranslation } from "react-i18next"
import logoImg from "@/assets/QM-LOGO.png"
import type { WikiState } from "@/stores/wiki-store"
import { saveTheme } from "@/lib/project-store"

type NavView = WikiState["activeView"]

const SEARCH_NAV_ITEM: { view: NavView; icon: typeof FileText; labelKey: string; novelLabelKey: string } = {
  view: "search",
  icon: Search,
  labelKey: "nav.search",
  novelLabelKey: "novel.nav.search",
}

const NAV_ITEMS: { view: NavView; icon: typeof FileText; labelKey: string; novelLabelKey: string }[] = [
  { view: "wiki", icon: FileText, labelKey: "nav.wiki", novelLabelKey: "novel.nav.wiki" },
  { view: "sources", icon: FolderOpen, labelKey: "nav.sources", novelLabelKey: "novel.nav.sources" },
  { view: "graph", icon: Network, labelKey: "nav.graph", novelLabelKey: "novel.nav.graph" },
  { view: "lint", icon: Brain, labelKey: "nav.lint", novelLabelKey: "novel.nav.lint" },
  { view: "soul", icon: Sparkles, labelKey: "nav.soul", novelLabelKey: "novel.nav.soul" },
  { view: "reviewCenter", icon: LayoutDashboard, labelKey: "nav.reviewCenter", novelLabelKey: "novel.nav.reviewCenter" },
]

const NAV_GROUPS: Array<{
  label: string
  views: NavView[]
}> = [
  { label: "创作", views: ["wiki", "sources"] },
  { label: "记忆", views: ["graph", "lint", "soul"] },
  { label: "审稿", views: ["reviewCenter"] },
]

interface IconSidebarProps {
  onToggleSidebar?: () => void
  onOpenSidebar?: () => void
  onSwitchProject: () => void
}

export function IconSidebar({ onToggleSidebar, onOpenSidebar, onSwitchProject }: IconSidebarProps) {
  const { t } = useTranslation()
  const activeView = useWikiStore((s) => s.activeView)
  const setActiveView = useWikiStore((s) => s.setActiveView)
  const setSearchPanelOpen = useWikiStore((s) => s.setSearchPanelOpen)
  const selectedFile = useWikiStore((s) => s.selectedFile)
  const setSelectedFile = useWikiStore((s) => s.setSelectedFile)
  const novelMode = useWikiStore((s) => s.novelMode)
  const theme = useWikiStore((s) => s.theme)
  const setTheme = useWikiStore((s) => s.setTheme)
  const pendingCount = useReviewStore((s) => s.items.filter((i) => !i.resolved).length)

  const handleCycleTheme = () => {
    const themes: ("light" | "dark" | "deep-blue")[] = ["light", "dark", "deep-blue"]
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    
    setTheme(nextTheme)
    saveTheme(nextTheme)
    
    // 更新 html 类
    document.documentElement.classList.remove("dark", "deep-blue")
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (nextTheme === "deep-blue") {
      document.documentElement.classList.add("deep-blue")
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return <Sun className="h-5 w-5" />
      case "dark": return <Moon className="h-5 w-5" />
      case "deep-blue": return <Monitor className="h-5 w-5" />
      default: return <Sun className="h-5 w-5" />
    }
  }

  const getThemeTooltip = () => {
    switch (theme) {
      case "light": return t("theme.toDark")
      case "dark": return t("theme.toDeepBlue")
      case "deep-blue": return t("theme.toLight")
      default: return t("theme.switch")
    }
  }

  // Model connection status check
  const llmConfig = useWikiStore((s) => s.llmConfig)
  const [modelStatus, setModelStatus] = useState<"connected" | "checking" | "disconnected">("checking")
  useEffect(() => {
    const checkModel = async () => {
      try {
        const { hasUsableLlm } = await import("@/lib/has-usable-llm")
        if (!hasUsableLlm(llmConfig)) {
          setModelStatus("disconnected")
          return
        }
        // Build the models endpoint based on provider
        const { getHttpFetch } = await import("@/lib/tauri-fetch")
        const httpFetch = await getHttpFetch()
        let modelsUrl = ""
        if (llmConfig.provider === "ollama") {
          const base = (llmConfig.ollamaUrl || "http://127.0.0.1:11434").replace(/\/+$/, "")
          modelsUrl = `${base}/api/tags`
        } else if (llmConfig.provider === "custom" || llmConfig.provider === "minimax") {
          // customEndpoint 可能是 "/v1" 或 "/v1/chat/completions"，去掉 /chat/completions 保留 /v1
          const base = (llmConfig.customEndpoint || "").replace(/\/+$/, "").replace(/\/chat\/completions$/i, "")
          if (!base) { setModelStatus("disconnected"); return }
          modelsUrl = `${base}/models`
        } else if (llmConfig.provider === "openai") {
          modelsUrl = "https://api.openai.com/v1/models"
        } else if (llmConfig.provider === "anthropic") {
          // Anthropic 没有 /models 端点，配置有 key 就认为连接正常
          setModelStatus("connected")
          return
        } else {
          // claude-code, codex-cli etc. — assume connected if hasUsableLlm
          setModelStatus("connected")
          return
        }
        const headers: Record<string, string> = {}
        if (llmConfig.apiKey) headers["Authorization"] = `Bearer ${llmConfig.apiKey}`
        const response = await httpFetch(modelsUrl, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(8000),
        })
        setModelStatus(response.ok ? "connected" : "disconnected")
      } catch {
        setModelStatus("disconnected")
      }
    }
    checkModel()
    const interval = setInterval(checkModel, 60000)
    return () => clearInterval(interval)
  }, [llmConfig])

  const handleNavClick = (view: NavView) => {
    setSearchPanelOpen(false)
    const normalizedSelectedFile = selectedFile?.replace(/\\/g, "/") ?? ""
    if (
      view === "wiki" &&
      normalizedSelectedFile &&
      !normalizedSelectedFile.includes("/wiki/chapters/")
    ) {
      setSelectedFile(null)
    }
    if (
      novelMode &&
      view === "sources" &&
      normalizedSelectedFile &&
      !normalizedSelectedFile.includes("/wiki/outlines/")
    ) {
      setSelectedFile(null)
    }
    setActiveView(view)
  }

  const handleSearchClick = () => {
    setSearchPanelOpen(false)
    setActiveView("search")
  }

  const renderNavItem = ({ view, icon: Icon, labelKey, novelLabelKey }: typeof NAV_ITEMS[number]) => {
    const label = t(novelMode ? novelLabelKey : labelKey)

    return (
      <Tooltip key={view}>
        <TooltipTrigger
          onClick={() => handleNavClick(view)}
          className={`wy-rail-button relative ${
            activeView === view
              ? "qm-selected"
              : "text-sidebar-foreground/70 qm-hover"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
          <span className="wy-rail-label">{label}</span>
          {view === "reviewCenter" && pendingCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="right">
          {label}
          {view === "reviewCenter" && pendingCount > 0 && ` (${pendingCount})`}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delay={300}>
      <div className="wy-rail flex h-full w-[76px] flex-col items-center border-r border-sidebar-border bg-sidebar px-2 py-3 text-sidebar-foreground">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="wy-brand-button mb-4 flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/70 p-1.5 shadow-sm transition-colors hover:bg-sidebar-accent"
          title={t("iconSidebar.toggleSidebar")}
        >
          <img
            src={logoImg}
            alt={t("iconSidebar.logoAlt")}
            className="h-7 w-7 rounded-[22%]"
          />
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-semibold leading-4">唯一</span>
            <span className="block truncate text-[10px] leading-3 text-sidebar-foreground/60">WORK</span>
          </span>
        </button>
        {/* Top: main nav items */}
        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden pb-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="w-full">
              <div className="wy-rail-group-label">{group.label}</div>
              <div className="mt-1 flex flex-col gap-1">
                {group.views.map((view) => {
                  const item = NAV_ITEMS.find((candidate) => candidate.view === view)
                  return item ? renderNavItem(item) : null
                })}
              </div>
            </div>
          ))}
          <Tooltip>
            <TooltipTrigger
              onClick={handleSearchClick}
              className={`wy-rail-button relative ${
                activeView === "search"
                  ? "qm-selected"
                  : "text-sidebar-foreground/70 qm-hover"
              }`}
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="wy-rail-label">
                {t(novelMode ? SEARCH_NAV_ITEM.novelLabelKey : SEARCH_NAV_ITEM.labelKey)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t(novelMode ? SEARCH_NAV_ITEM.novelLabelKey : SEARCH_NAV_ITEM.labelKey)}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={() => {
                setSearchPanelOpen(false)
                setActiveView("trash")
                onOpenSidebar?.()
              }}
              className={`wy-rail-button relative ${
                activeView === "trash"
                  ? "qm-selected"
                  : "text-sidebar-foreground/70 qm-hover"
              }`}
            >
              <Trash2 className="h-[18px] w-[18px]" />
              <span className="wy-rail-label">{t("nav.trash")}</span>
            </TooltipTrigger>
            <TooltipContent side="right">{t("nav.trash")}</TooltipContent>
          </Tooltip>
        </div>
        {/* Bottom: daemon status + theme toggle + settings + switch project */}
        <div className="flex w-full flex-col items-center gap-1 border-t border-sidebar-border/70 pt-2">
          {/* Model connection status indicator */}
          <Tooltip>
            <TooltipTrigger className="flex h-6 w-6 items-center justify-center">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  modelStatus === "connected" ? "bg-emerald-500" :
                  modelStatus === "checking" ? "bg-amber-400 animate-pulse" :
                  "bg-red-500"
                }`}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              {modelStatus === "connected" && t("iconSidebar.modelConnected")}
              {modelStatus === "checking" && t("iconSidebar.modelChecking")}
              {modelStatus === "disconnected" && t("iconSidebar.modelDisconnected")}
            </TooltipContent>
          </Tooltip>
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger
              onClick={handleCycleTheme}
              className="wy-rail-button relative text-sidebar-foreground/70"
            >
              {getThemeIcon()}
              <span className="wy-rail-label">主题</span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {getThemeTooltip()}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={() => {
                setSearchPanelOpen(false)
                setActiveView("settings")
              }}
              className={`wy-rail-button relative ${
                activeView === "settings"
                  ? "qm-selected"
                  : "text-sidebar-foreground/70 qm-hover"
              }`}
            >
              <Settings className="h-[18px] w-[18px]" />
              <span className="wy-rail-label">{t(novelMode ? "novel.nav.settings" : "nav.settings")}</span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t(novelMode ? "novel.nav.settings" : "nav.settings")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={() => {
                setSearchPanelOpen(false)
                onSwitchProject()
              }}
              className="wy-rail-button text-sidebar-foreground/70"
            >
              <ArrowLeftRight className="h-[18px] w-[18px]" />
              <span className="wy-rail-label">切换</span>
            </TooltipTrigger>
            <TooltipContent side="right">{t("nav.switchProject")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
