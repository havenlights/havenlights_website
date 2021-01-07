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
const imagemin = require('imagemin')
const imageminSvgo = require('imagemin-svgo')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const Feed = require("feed").Feed

const outputPath = process.env.HL_PATH || 'publish'

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const band = loadJson('band.json')
const music = loadJson('music.json')
const news = loadJson('news.json').sort((x, y) => x.date.localeCompare(y.date)).reverse()
const sections = loadJson('sections.json')
const socialLinks = loadJson('social_links.json')
const static = loadJson('static.json')
const meta = loadJson('meta.json')

const main_template = fs.readFileSync('template.html', 'utf8')

function renderFile(title, contents, file, description, metadata) {
  const data = Mustache.render(main_template, {
    page_title: title,
    social_links: socialLinks,
    sections: sections,
    page_contents: contents,
    description: description,
    metadata: metadata
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
      contents: fs.readFileSync(`news/${x.contents}.html`, 'utf8'),
      id: x.contents,
      title: x.title
    }))
  })

  renderFile('Home', contents, 'index.html', "Melodic Metal band from Tuscany, Italy", meta)
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
    renderFile(member.name, fs.readFileSync(`band/${member.filename}.html`, 'utf8'), `band/${member.filename}.html`, member.description, member.metadata)
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
    renderFile(album.name, fs.readFileSync(`albums/${album.filename}.html`, 'utf8'), `albums/${album.filename}.html`, "Album by Havenlights", album.metadata)
  }
}

function renderFeeds() {
  const feed = new Feed({
    title: "Havenlights",
    description: "Havenlights news feed",
    id: "http://havenlights-band.com",
    link: "http://havenlights-band.com",
    language: "en",
    copyright: "All rights reserved 2021, Havenlights",
    feedLinks: {
      json: "http://havenlights-band.com/feed.json",
      atom: "http://havenlights-band.com/atom.xml"
    }
  })

  for(let article of news) {
    feed.addItem({
      title: article.title,
      id: `http://havenlights-band.com/index.html#${article.contents}`,
      link: `http://havenlights-band.com/index.html#${article.contents}`,
      content: fs.readFileSync(`news/${article.contents}.html`, 'utf8'),
      date: new Date(article.date)
    });
  }

  fs.writeFileSync(`${outputPath}/rss.xml`, feed.rss2());
  fs.writeFileSync(`${outputPath}/atom.xml`, feed.atom1());
  fs.writeFileSync(`${outputPath}/feed.json`, feed.json1());
}

if(!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath)
}

if(!fs.existsSync(`${outputPath}/assets`)) {
  fs.mkdirSync(`${outputPath}/assets`)
}

renderIndex();
renderBand();
renderStatic();
renderMusic();
renderFeeds();

(async () => {
  await imagemin(['assets/*'], {
    destination: `${outputPath}/assets`,
    plugins: [
      imageminMozjpeg({
        quality: [80, 100]
      }),
      imageminPngquant({
        quality: [1, 1]
      }),
      imageminSvgo()
    ]
  });
})();