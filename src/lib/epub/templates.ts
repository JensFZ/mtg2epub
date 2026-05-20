export function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:schemas:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

export function contentOpf(params: {
  uid: string;
  title: string;
  width: number;
  height: number;
  items: Array<{ id: string; href: string; mediaType: string }>;
  pageIds: string[];
}): string {
  const { uid, title, width, height, items, pageIds } = params;

  const manifestItems = items
    .map((item) => `    <item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"/>`)
    .join("\n");

  const spineItems = pageIds
    .map((id) => `    <itemref idref="${id}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${uid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>de</dc:language>
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:spread">none</meta>
    <meta property="rendition:orientation">portrait</meta>
    <meta name="viewport" content="width=${width}, height=${height}"/>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles/card.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`;
}

export function tocNcx(params: {
  uid: string;
  title: string;
  navPoints: Array<{ id: string; label: string; href: string; order: number }>;
}): string {
  const { uid, title, navPoints } = params;

  const points = navPoints
    .map(
      (np) => `  <navPoint id="${np.id}" playOrder="${np.order}">
    <navLabel><text>${escapeXml(np.label)}</text></navLabel>
    <content src="${np.href}"/>
  </navPoint>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
${points}
  </navMap>
</ncx>`;
}

export function navXhtml(params: {
  title: string;
  navItems: Array<{ label: string; href: string }>;
}): string {
  const { title, navItems } = params;

  const items = navItems
    .map((item) => `      <li><a href="${item.href}">${escapeXml(item.label)}</a></li>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(title)}</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${escapeXml(title)}</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>`;
}

export function cardXhtml(params: {
  title: string;
  width: number;
  height: number;
  imageSrc: string;
}): string {
  const { title, width, height, imageSrc } = params;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=${width}, height=${height}"/>
  <link rel="stylesheet" type="text/css" href="../styles/card.css"/>
  <title>${escapeXml(title)}</title>
</head>
<body>
  <div class="card-page">
    <img src="${imageSrc}" alt="${escapeXml(title)}" class="card-image"/>
  </div>
</body>
</html>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
