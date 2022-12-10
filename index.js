import * as d3 from 'd3'

async function handleRequest (request) {
  const { search, pathname, searchParams } = new URL(request.url)

  if (pathname.startsWith('/favicon')) return new Response('', { headers: { 'content-type': 'text' } })

  const refr = request.headers.get('Referer')

  const typesPath = pathname.replace('/', '') || 'bars'
  const types = typesPath.split('+')

  const strdata = searchParams.get('data') || ''
  const data = strdata.split(',').map(d => +d)
  const color = searchParams.get('color') || '#1F89F2'
  const spline = searchParams.get('spline')

  const padding = 10

  const w = 500 - padding*2
  const h = 200 - padding*2

  const mapX = d3.scaleBand()
    .domain(d3.range(data.length))
    .range([padding, w-padding])
    .paddingInner(0.05)
    .paddingOuter([0])
    .align([0.5])


  const extY = d3.extent(data)

  const mapY = d3.scaleLinear()
    .domain(extY)
    .nice()
    .range([h-padding,padding])

  const cw = mapX.bandwidth()
  const zero = mapY(0)

  var lineGen = d3.line()
    .x((d, i) => mapX(i) + cw/2)
    .y((d, i) => mapY(d))

  var areaGen = d3.area()
    .x((d, i) => mapX(i) + cw/2)
    .y1((d, i) => mapY(d))
    .y0(zero)

  if(spline){
    lineGen.curve(d3.curveCatmullRom.alpha(0.5))//d3.curveBasis)
    areaGen.curve(d3.curveCatmullRom.alpha(0.5))//d3.curveBasis)
  }

  let body = ''

  const bars = () => {
    data.forEach((d,i) => {
      const cx = mapX(i)
      const cy = mapY( Math.max(0, d) )
      const ch = Math.abs( mapY(d) - zero) 
      body += `<rect fill="${color}" x="${cx}" y="${cy}" width="${cw}" height="${ch}"></rect>`
    })
  }

  const dots = () => {
    data.forEach((d,i) => {
      const cx = mapX(i) + cw/2
      const cy = mapY(d)
      body += `<circle style="vector-effect:non-scaling-size;" fill="${color}" cx="${cx}" cy="${cy}" r="5"></circle>`
    })
  }

  const line = () => {
    body += `<path fill="none" style="vector-effect:non-scaling-stroke;" stroke="${color}" d="${lineGen(data)}"></path>`
  }

  const area = () => {
    body += `<path fill="${color}" d="${areaGen(data)}"></path>`
  }

  const funcs = {
    bars, dots, line, area
  }

  types.forEach(type => {
    funcs[type]()
  })

  const svg = `<svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlns:xlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="none"
    viewBox="0 0 ${w} ${h}">
      <line style="vector-effect:non-scaling-stroke;" stroke="#ccc" x1="0" x2="${w}" y1="${zero}" y2="${zero}"></line>
      ${body}
  </svg>`

  return new Response(svg, { headers: { 'content-type': 'image/svg+xml' } })
}
  
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
