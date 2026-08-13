import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingNav from '../components/marketing/MarketingNav'
import { ProductHero } from '../components/marketing/primitives'
import { useSeo } from '../lib/seo'
import '../styles/contact.css'

const contactChannels = [
  {
    title: 'Contact a human',
    email: 'vivekgupta@memcode.in',
    href: 'mailto:vivekgupta@memcode.in',
  },
  {
    title: 'Contact our Company Brain',
    email: 'memcode@agentmail.to',
    href: 'mailto:memcode@agentmail.to',
  },
]

export default function ContactPage() {
  useSeo({
    title: 'Contact MemCode | Talk to Our Team or Company Brain',
    description:
      'Email the MemCode team, contact our Company Brain, or book a demo directly with our founder.',
    path: '/contact',
    image: '/background_thread.jpeg',
  })

  return (
    <div className="landing-shell memcode-look contact-page">
      <MarketingNav />
      <main>
        <ProductHero
          title="Hand us your company. You take the scenic route."
          subtitle={(
            <span className="contact-page__channels">
              {contactChannels.map((channel) => (
                <span className="contact-page__channel" key={channel.email}>
                  <span className="contact-page__channel-label">{channel.title}</span>
                  <a className="contact-page__email" href={channel.href}>{channel.email}</a>
                </span>
              ))}
            </span>
          )}
          primary={{ label: 'Book a demo with our founder', booking: true }}
          backgroundImage="/background_thread.jpeg"
        />
      </main>
      <MarketingFooter />
    </div>
  )
}
