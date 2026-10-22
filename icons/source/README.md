# Icon source

`icon.html` draws the icon as SVG (gold eight-point star, «القرآن» in Amiri Bold); `render.js` renders the PNGs with Playwright:

```
node render.js '[{"size":512,"out":"../icon-512.png","q":{"text":"القرآن","font":"Amiri","fs":"235","dy":"-6"}}]'
```

Query options: `scale` (0.92 for maskable), `mono=1&bg=0` (monochrome), `text`, `fs`, `dy`.
Amiri font: SIL Open Font License 1.1 (https://github.com/aliftype/amiri).
