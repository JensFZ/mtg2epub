export function getCardCss(): string {
  return `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: 100%;
  height: 100%;
  background-color: #000000;
  overflow: hidden;
}
.card-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
`.trim();
}
