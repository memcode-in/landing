import { useEffect, useMemo, useRef, useState } from 'react'
import blogs from '../data/blogs.json'
import { SITE_ORIGIN, absoluteUrl, useSeo } from '../lib/seo'
import MarketingNav from '../components/marketing/MarketingNav'
import MarketingFooter from '../components/marketing/MarketingFooter'
import SmoothInput from '../components/SmoothInput'

type BlogSection = {
  id: string
  title: string
  content: string[]
}

type BlogPost = {
  id: number
  slug: string
  title: string
  subtitle: string
  description: string
  author: string
  date: string
  readTime: string
  category: string
  featured: boolean
  image: string
  sections: BlogSection[]
}

const blogPosts = blogs as BlogPost[]
const blogCategories = ['All', 'Memory', 'Engineering', 'Product', 'CLI']

function BlogNavbar() {
  return <MarketingNav />
}

function BlogFooter() {
  return <MarketingFooter />
}

function FeaturedBlogCard({ post }: { post: BlogPost }) {
  return (
    <a className="blog-feature-card animate-fade-up" href={`/blogs/${post.slug}`}>
      <div className="blog-feature-card__media"><img className="blog-feature-card__image" src={post.image} alt={post.title} /></div>
      <div className="blog-feature-card__body">
        <div className="blog-meta">
          <span>{post.author}</span>
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>
        <h2>{post.title}</h2>
        <p>{post.description}</p>
      </div>
    </a>
  )
}

function BlogListItem({ post }: { post: BlogPost }) {
  return (
    <a className="blog-list-item" href={`/blogs/${post.slug}`}>
      <img className="blog-list-item__image" src={post.image} alt={post.title} />
      <div className="blog-list-item__body">
        <div className="blog-meta">
          <span>{post.author}</span>
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>
        <h3>{post.title}</h3>
        <p>{post.description}</p>
      </div>
      <span className="blog-list-item__arrow" aria-hidden="true">View</span>
    </a>
  )
}

export function BlogsPage() {
  useSeo({
    title: 'MemCode Blog - Coding Agents, Memory, and Model Workflows',
    description: 'Read MemCode product notes and engineering essays about AI coding agents, persistent project memory, terminal workflows, and model routing.',
    path: '/blogs',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'MemCode Blog',
      url: `${SITE_ORIGIN}/blogs`,
      description: 'Product notes and engineering thinking from the MemCode team.',
    },
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const featuredPost = blogPosts.find((post) => post.featured) ?? blogPosts[0]
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return blogPosts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory
      const matchesSearch = !query || [post.title, post.description, post.author, post.category].some((value) => value.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <div className="landing-shell memcode-look blog-shell">
      <BlogNavbar />
      <main className="blog-page">
        <section className="container blog-index">
          <div className="blog-index__header">
            <h1>Notes on coding agents that remember.</h1>
            <p>Essays on memory, model routing, terminal workflows, and agent infrastructure.</p>
          </div>
          <p className="blog-section-label">Featured essay</p>
          <FeaturedBlogCard post={featuredPost} />
          <div className="blog-all-head">
            <div>
              <p className="blog-section-label">All articles</p>
              <h2>Browse the archive</h2>
            </div>
            <div className="blog-search" role="search">
              <span className="blog-search__icon" aria-hidden="true" />
              <SmoothInput
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
          <div className="blog-tabs" aria-label="Article categories">
            {blogCategories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? 'is-active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="blog-list" aria-label="Blog articles">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => <BlogListItem key={post.slug} post={post} />)
            ) : (
              <div className="blog-empty">
                <p>No articles found for this filter.</p>
                <button type="button" onClick={() => { setSearchQuery(''); setActiveCategory('All') }}>Reset filters</button>
              </div>
            )}
          </div>
        </section>
      </main>
      <BlogFooter />
    </div>
  )
}

export function BlogPostPage({ slug }: { slug: string }) {
  const post = blogPosts.find((item) => item.slug === slug)
  const canonicalPath = post ? `/blogs/${post.slug}` : `/blogs/${slug}`

  useSeo({
    title: post ? `${post.title} | MemCode Blog` : 'Article Not Found | MemCode Blog',
    description: post?.description ?? 'The requested MemCode blog article could not be found.',
    path: canonicalPath,
    type: post ? 'article' : 'website',
    image: post?.image,
    noindex: !post,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          image: absoluteUrl(post.image),
          author: {
            '@type': 'Person',
            name: post.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'MemCode',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_ORIGIN}/logo.jpeg`,
            },
          },
          datePublished: new Date(post.date).toISOString(),
          mainEntityOfPage: absoluteUrl(canonicalPath),
          articleBody: post.sections.flatMap((section) => section.content).join(' '),
        }
      : undefined,
  })

  const [activeId, setActiveId] = useState(post?.sections[0]?.id ?? '')
  const [isTocOpen, setIsTocOpen] = useState(false)
  const tocButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [tocRail, setTocRail] = useState({ top: 0, height: 0 })

  useEffect(() => {
    if (!post) return

    let frame = 0
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const anchorOffset = 132
        const fallbackId = post.sections[0]?.id ?? ''
        let currentId = fallbackId

        post.sections.forEach((section) => {
          const element = document.getElementById(section.id)
          if (element && element.getBoundingClientRect().top <= anchorOffset) {
            currentId = section.id
          }
        })

        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
          currentId = post.sections[post.sections.length - 1]?.id ?? currentId
        }

        setActiveId(currentId)
      })
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [post])

  useEffect(() => {
    const button = tocButtonRefs.current[activeId]
    const toc = button?.closest('.blog-toc') as HTMLElement | null
    if (!button || !toc) return

    const updateRail = () => {
      const buttonRect = button.getBoundingClientRect()
      const tocRect = toc.getBoundingClientRect()
      setTocRail({
        top: buttonRect.top - tocRect.top,
        height: buttonRect.height,
      })
    }

    updateRail()
    window.addEventListener('resize', updateRail)
    return () => window.removeEventListener('resize', updateRail)
  }, [activeId, post])

  if (!post) {
    return (
      <div className="landing-shell memcode-look blog-shell">
        <BlogNavbar />
        <main className="blog-page">
          <section className="container blog-missing">
            <h1>Article not found.</h1>
            <p>The article you are looking for may have moved or has not been published yet.</p>
            <a className="btn btn--primary" href="/blogs">Back to blogs</a>
          </section>
        </main>
        <BlogFooter />
      </div>
    )
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setIsTocOpen(false)
  }

  return (
    <div className="landing-shell memcode-look blog-shell">
      <BlogNavbar />
      <main className="blog-page">
        <article className="container blog-article-layout">
          <div className="blog-article">
            <a className="blog-back-link" href="/blogs">Back to blogs</a>
            <div className="blog-meta">
              <span>{post.author}</span>
              <span>{post.date}</span>
              <span>{post.readTime}</span>
            </div>
            <h1>{post.title}</h1>
            <p className="blog-article__subtitle">{post.subtitle}</p>
            <img className="blog-article__image" src={post.image} alt={post.title} />
            {post.sections.map((section) => (
              <section key={section.id} id={section.id} className="blog-content-section">
                <h2>{section.title}</h2>
                {section.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
          </div>
          <aside className="blog-toc" aria-label="Article contents">
            <span
              className="blog-toc__rail"
              style={{ transform: `translateY(${tocRail.top}px)`, height: `${tocRail.height}px` }}
              aria-hidden="true"
            />
            <h2>Contents</h2>
            {post.sections.map((section) => (
              <button
                type="button"
                key={section.id}
                ref={(element) => { tocButtonRefs.current[section.id] = element }}
                className={activeId === section.id ? 'is-active' : ''}
                onClick={() => scrollToSection(section.id)}
              >
                {section.title}
              </button>
            ))}
          </aside>
        </article>
      </main>
      <button
        type="button"
        className={isTocOpen ? 'toc-toggle is-open' : 'toc-toggle'}
        onClick={() => setIsTocOpen((value) => !value)}
        aria-label="Toggle article contents"
        aria-expanded={isTocOpen}
      >
        <span />
      </button>
      <div className={isTocOpen ? 'mobile-toc is-open' : 'mobile-toc'} aria-hidden={!isTocOpen}>
        <h2>Contents</h2>
        {post.sections.map((section) => (
          <button
            type="button"
            key={section.id}
            className={activeId === section.id ? 'is-active' : ''}
            onClick={() => scrollToSection(section.id)}
          >
            {section.title}
          </button>
        ))}
      </div>
      <BlogFooter />
    </div>
  )
}
