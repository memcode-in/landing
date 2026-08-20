export const COMPANY_BRAIN_CHANNELS = [
  { id: 'slack', label: 'Slack', logo: '/brands/slack.png', invertOnDark: false },
  { id: 'whatsapp', label: 'WhatsApp', logo: '/brands/whatsapp.png', invertOnDark: false },
  { id: 'telegram', label: 'Telegram', logo: '/brands/telegram.png', invertOnDark: false },
  { id: 'teams', label: 'Microsoft Teams', logo: '/team.png', invertOnDark: false },
] as const

const COMPANY_BRAIN_KNOWLEDGE_SOURCES = [
  { id: 'gmail', label: 'Gmail', logo: '/brands/gmail.png', invertOnDark: false },
  { id: 'notion', label: 'Notion', logo: '/brands/notion.png', invertOnDark: true },
  { id: 'claude', label: 'Claude', logo: '/brands/claude.png', invertOnDark: false },
  { id: 'codex', label: 'Codex', logo: '/brands/chatgpt.png', invertOnDark: true },
  { id: 'cursor', label: 'Cursor', logo: '/brands/cursor.png', invertOnDark: false },
  { id: 'linkedin', label: 'LinkedIn', logo: '/brands/linkedin.png', invertOnDark: false },
] as const

export const COMPANY_BRAIN_CONNECTORS = [
  COMPANY_BRAIN_CHANNELS[0],
  ...COMPANY_BRAIN_KNOWLEDGE_SOURCES,
] as const

export const COMPANY_BRAIN_DISCONNECTED_CONNECTORS = [
  ...COMPANY_BRAIN_CHANNELS,
  ...COMPANY_BRAIN_KNOWLEDGE_SOURCES,
] as const
