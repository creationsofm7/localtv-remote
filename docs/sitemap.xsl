<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>XML Sitemap — LocalTV Remote</title>
        <style>
          :root{--ink:#111;--muted:#6b6b6b;--line:#e6e6e6;--neon:#ccff00;}
          *{box-sizing:border-box;}
          body{margin:0;background:#fff;color:var(--ink);
            font-family:"Courier Prime",ui-monospace,"Cascadia Mono",monospace;
            padding:clamp(24px,5vw,56px);line-height:1.6;}
          .wrap{max-width:900px;margin:0 auto;}
          h1{font-size:clamp(1.6rem,4vw,2.2rem);margin:0 0 6px;}
          h1 .hl{background:var(--neon);padding:0 .15em;}
          p.lead{color:var(--muted);margin:0 0 28px;font-size:13px;}
          .count{display:inline-block;border:1.5px solid var(--ink);padding:2px 10px;margin-left:8px;font-size:13px;}
          table{width:100%;border-collapse:collapse;font-size:13px;}
          th{text-align:left;text-transform:uppercase;letter-spacing:.12em;font-size:11px;
            color:var(--muted);border-bottom:1.5px solid var(--ink);padding:8px 10px;}
          td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top;}
          td a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line);}
          td a:hover{border-color:var(--ink);}
          .foot{margin-top:24px;font-size:12px;color:var(--muted);}
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>XML <span class="hl">Sitemap</span></h1>
          <p class="lead">This file lists the pages of LocalTV Remote for search engines such as Google and Bing. It is a valid XML sitemap — this styled view is only for humans.</p>
          <p>
            <strong>URLs</strong>
            <span class="count"><xsl:value-of select="count(s:urlset/s:url)"/></span>
          </p>
          <table>
            <thead>
              <tr><th>URL</th><th>Last modified</th></tr>
            </thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                  <td><xsl:value-of select="s:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <p class="foot">Generated for <a href="https://github.com/creationsofm7/localtv-remote">LocalTV Remote</a>.</p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
