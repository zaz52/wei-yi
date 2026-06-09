export const APP_NAME = "QMai Studio"

export function formatAppTitle(projectName: string | null | undefined): string {
  const name = projectName?.trim()
  return name ? `${APP_NAME}｜${name}` : APP_NAME
}
