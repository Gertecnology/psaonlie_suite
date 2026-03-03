export function getSystemShortcutModifier(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+'

  const uaDataPlatform = (navigator as Navigator & {
    userAgentData?: { platform?: string }
  }).userAgentData?.platform

  if (uaDataPlatform && /macos|ios/i.test(uaDataPlatform)) {
    return '⌘ '
  }

  if (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return '⌘ '
  }

  return 'Ctrl+ '
}

export function getSystemShortcutLabel(key: string): string {
  return `${getSystemShortcutModifier()}${key.toUpperCase()}`
}
