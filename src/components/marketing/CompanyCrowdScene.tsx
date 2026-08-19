import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'

interface CrowdCanvasProps {
  src: string
  rows?: number
  cols?: number
}

const CrowdCanvas = ({ src, rows = 15, cols = 7 }: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const config = {
      src,
      rows,
      cols,
    }

    // UTILS
    const randomRange = (min: number, max: number) =>
      min + Math.random() * (max - min)
    const randomIndex = (array: any[]) => randomRange(0, array.length) | 0
    const removeFromArray = (array: any[], i: number) => array.splice(i, 1)[0]
    const removeItemFromArray = (array: any[], item: any) =>
      removeFromArray(array, array.indexOf(item))
    const removeRandomFromArray = (array: any[]) =>
      removeFromArray(array, randomIndex(array))
    const getRandomFromArray = (array: any[]) => array[randomIndex(array) | 0]

    // TWEEN FACTORIES
    const resetPeep = ({ stage, peep }: { stage: any; peep: any }) => {
      const direction = Math.random() > 0.5 ? 1 : -1
      const offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random())
      const startY = stage.height - peep.height + offsetY
      let startX: number
      let endX: number

      if (direction === 1) {
        startX = -peep.width
        endX = stage.width
        peep.scaleX = 1
      } else {
        startX = stage.width + peep.width
        endX = 0
        peep.scaleX = -1
      }

      peep.x = startX
      peep.y = startY
      peep.anchorY = startY

      return {
        startX,
        startY,
        endX,
      }
    }

    const normalWalk = ({ peep, props }: { peep: any; props: any }) => {
      const { startY, endX } = props
      const xDuration = 10
      const yDuration = 0.25

      const tl = gsap.timeline()
      tl.timeScale(randomRange(0.5, 1.5))
      tl.to(
        peep,
        {
          duration: xDuration,
          x: endX,
          ease: 'none',
        },
        0,
      )
      tl.to(
        peep,
        {
          duration: yDuration,
          repeat: xDuration / yDuration,
          yoyo: true,
          y: startY - 10,
        },
        0,
      )

      return tl
    }

    const walks = [normalWalk]

    // TYPES
    type Peep = {
      image: HTMLImageElement
      rect: number[]
      width: number
      height: number
      drawArgs: any[]
      x: number
      y: number
      anchorY: number
      scaleX: number
      walk: any
      setRect: (rect: number[]) => void
      render: (context: CanvasRenderingContext2D) => void
    }

    // FACTORY FUNCTIONS
    const createPeep = ({
      image,
      rect,
    }: {
      image: HTMLImageElement
      rect: number[]
    }): Peep => {
      const peep: Peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        drawArgs: [],
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
        setRect: (nextRect: number[]) => {
          peep.rect = nextRect
          peep.width = nextRect[2]
          peep.height = nextRect[3]
          peep.drawArgs = [
            peep.image,
            ...nextRect,
            0,
            0,
            peep.width,
            peep.height,
          ]
        },
        render: (context: CanvasRenderingContext2D) => {
          context.save()
          context.translate(peep.x, peep.y)
          context.scale(peep.scaleX, 1)
          context.drawImage(
            peep.image,
            peep.rect[0],
            peep.rect[1],
            peep.rect[2],
            peep.rect[3],
            0,
            0,
            peep.width,
            peep.height,
          )
          context.restore()
        },
      }

      peep.setRect(rect)
      return peep
    }

    // MAIN
    const img = document.createElement('img')
    const stage = {
      width: 0,
      height: 0,
    }

    const allPeeps: Peep[] = []
    const availablePeeps: Peep[] = []
    const crowd: Peep[] = []
    let disposed = false

    const createPeeps = () => {
      const { rows: rowCount, cols: columnCount } = config
      const { naturalWidth: width, naturalHeight: height } = img
      const total = rowCount * columnCount
      const rectWidth = width / rowCount
      const rectHeight = height / columnCount

      for (let i = 0; i < total; i++) {
        allPeeps.push(
          createPeep({
            image: img,
            rect: [
              (i % rowCount) * rectWidth,
              ((i / rowCount) | 0) * rectHeight,
              rectWidth,
              rectHeight,
            ],
          }),
        )
      }
    }

    const initCrowd = () => {
      while (availablePeeps.length) {
        addPeepToCrowd().walk.progress(Math.random())
      }
    }

    const addPeepToCrowd = () => {
      const peep = removeRandomFromArray(availablePeeps)
      const walk = getRandomFromArray(walks)({
        peep,
        props: resetPeep({
          peep,
          stage,
        }),
      }).eventCallback('onComplete', () => {
        removePeepFromCrowd(peep)
        addPeepToCrowd()
      })

      peep.walk = walk

      crowd.push(peep)
      crowd.sort((a, b) => a.anchorY - b.anchorY)

      return peep
    }

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep)
      availablePeeps.push(peep)
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(devicePixelRatio, devicePixelRatio)

      crowd.forEach((peep) => {
        peep.render(ctx)
      })

      ctx.restore()
    }

    const resize = () => {
      stage.width = canvas.clientWidth
      stage.height = canvas.clientHeight
      canvas.width = stage.width * devicePixelRatio
      canvas.height = stage.height * devicePixelRatio

      crowd.forEach((peep) => {
        peep.walk.kill()
      })

      crowd.length = 0
      availablePeeps.length = 0
      availablePeeps.push(...allPeeps)

      initCrowd()
    }

    const init = () => {
      if (disposed) return
      createPeeps()
      resize()
      gsap.ticker.add(render)
    }

    img.onload = init
    img.src = config.src

    const handleResize = () => resize()
    window.addEventListener('resize', handleResize)

    return () => {
      disposed = true
      img.onload = null
      window.removeEventListener('resize', handleResize)
      gsap.ticker.remove(render)
      crowd.forEach((peep) => {
        if (peep.walk) peep.walk.kill()
      })
    }
  }, [src, rows, cols])

  return <canvas ref={canvasRef} className="company-crowd__canvas" aria-hidden="true" />
}

export default function CompanyCrowdScene({ hero = false }: { hero?: boolean }) {
  return (
    <section
      id={hero ? 'top' : undefined}
      className={`company-crowd ${hero ? 'company-crowd--hero' : ''}`}
      aria-labelledby="company-crowd-title"
    >
      <div className="container company-crowd__copy">
        {hero ? null : <span className="company-crowd__eyebrow">Continuous context</span>}
        {hero
          ? <h1 id="company-crowd-title">The brain goes wherever the company goes.</h1>
          : <h2 id="company-crowd-title">The brain goes wherever the company goes.</h2>}
        <p>
          Work moves from teammate to teammate, from <img className="company-crowd__inline-logo" src="/brands/gmail.png" alt="" /> inbox to <img className="company-crowd__inline-logo" src="/brands/cursor.png" alt="" /> codebase, and from one <img className="company-crowd__inline-logo" src="/brands/claude.png" alt="" /> agent to the next. The shared memory moves with it.
        </p>
      </div>
      <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
    </section>
  )
}

/**
 * Skiper 39 Canvas_Landing_004 — React + Canvas
 * Inspired by and adapted from https://codepen.io/zadvorsky/pen/xxwbBQV
 * Illustration by https://www.openpeeps.com/
 * Attribution: https://skiper-ui.com/v1/skiper39
 */
