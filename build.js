/*
 * Il CMS Fai-Da-Te by Francesco Bertolaccini
 *
 * I migliori programmi non hanno bisogno di commenti,
 * sono autoesplicativi.
 */

const Mustache = require('mustache')
const fs = require('fs')
const path = require('path')
const process = require('process')

const outputPath = process.env.HL_PATH || 'publish'

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const band = loadJson('band.json')
const music = loadJson('music.json')
const news = loadJson('news.json')
const sections = loadJson('sections.json')
const socialLinks = loadJson('social_links.json')
const static = loadJson('static.json')

const main_template = fs.readFileSync('template.html', 'utf8')

function renderFile(title, contents, file) {
  const data = Mustache.render(main_template, {
    page_title: title,
    social_links: socialLinks,
    sections: sections,
    page_contents: contents
  })
  fs.writeFileSync(`${outputPath}/${file}`, data)
}

function renderIndex() {
  const template = fs.readFileSync('index.html', 'utf8')
  const contents = Mustache.render(template, {
    articles: news.map(x => ({
      date: x.date,
      date_human: new Date(x.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      contents: fs.readFileSync(`news/${x.contents}.html`, 'utf8')
    }))
  })

  renderFile('Home', contents, 'index.html')
}

function renderBand() {
  const template = fs.readFileSync('band.html', 'utf8')
  const contents = Mustache.render(template, {
    members: band
  })

  renderFile('Band', contents, 'band.html')

  if(!fs.existsSync('publish/band')) {
    fs.mkdirSync('publish/band')
  }

  for(let member of band) {
    renderFile(member.name, fs.readFileSync(`band/${member.filename}.html`, 'utf8'), `band/${member.filename}.html`)
  }
}

function renderStatic() {
  for(let page of static) {
    renderFile(page.name, fs.readFileSync(`static/${page.filename}.html`, 'utf8'), `${page.filename}.html`);
  }
}

function renderMusic() {
  const template = fs.readFileSync('music.html', 'utf8')
  const contents = Mustache.render(template, music)

  renderFile('Music', contents, 'music.html')

  if(!fs.existsSync('publish/albums')) {
    fs.mkdirSync('publish/albums')
  }

  for(let album of music.albums) {
    renderFile(album.name, fs.readFileSync(`albums/${album.filename}.html`, 'utf8'), `albums/${album.filename}.html`)
  }
}

if(!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath)
}

if(!fs.existsSync(`${outputPath}/assets`)) {
  fs.mkdirSync(`${outputPath}/assets`)
}

renderIndex()
renderBand()
renderStatic()
renderMusic()

for(let asset of fs.readdirSync('assets')) {
  fs.copyFileSync(`assets/${asset}`, `${outputPath}/assets/${path.basename(asset)}`)
}