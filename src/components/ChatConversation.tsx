import { CSSProperties, useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  id: string
  sender: string
  avatar: string
  avatarLogoSrc?: string
  avatarLogoAlt?: string
  text: string
  isMe?: boolean
}

interface ChatConversationProps {
  title: string
  subtitle?: string
  meta?: string
  status?: string
  agentLabel?: string
  agentLogo?: string
  agentLogoSrc?: string
  agentLogoAlt?: string
  messages: ChatMessage[]
  variant?: 'default' | 'warning' | 'memory' | 'paper'
  messageDelayMs?: number
}

export default function ChatConversation({
  title,
  subtitle,
  meta,
  status = 'Live thread',
  agentLabel,
  agentLogo,
  agentLogoSrc,
  agentLogoAlt,
  messages,
  variant = 'default',
  messageDelayMs = 150,
}: ChatConversationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-80px' },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <article
      ref={containerRef}
      className={`chat-conversation chat-conversation--${variant} ${isVisible ? 'is-visible' : ''}`}
      style={{ '--message-delay': `${messageDelayMs}ms` } as CSSProperties}
    >
      <div className="chat-conversation__top">
        <div>
          <span>{status}</span>
          <strong>{title}</strong>
          {subtitle && <small>{subtitle}</small>}
        </div>
        {agentLabel && (
          <div className="chat-conversation__agent" aria-label={agentLabel}>
            <b>
              {agentLogoSrc ? (
                <img src={agentLogoSrc} alt={agentLogoAlt ?? agentLabel} />
              ) : (
                agentLogo ?? agentLabel.slice(0, 2)
              )}
            </b>
            <em>{agentLabel}</em>
          </div>
        )}
      </div>

      <div className="chat-conversation__stream">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={message.isMe ? 'chat-message chat-message--me' : 'chat-message'}
            style={{ '--message-index': index } as CSSProperties}
          >
            <span className="chat-message__avatar">
              {message.avatarLogoSrc ? (
                <img src={message.avatarLogoSrc} alt={message.avatarLogoAlt ?? message.sender} />
              ) : (
                message.avatar
              )}
            </span>
            <div>
              {!message.isMe && <small>{message.sender}</small>}
              <p>{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {meta && <div className="chat-conversation__meta">{meta}</div>}
    </article>
  )
}
