# Graph Report - C:\Users\Ashu\Documents\preplearn  (2026-07-22)

## Corpus Check
- 54 files · ~380,141 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 221 nodes · 370 edges · 41 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `getPageBySlug()` - 16 edges
2. `slugToHref()` - 11 edges
3. `slugToFilePath()` - 9 edges
4. `parsePageFile()` - 9 edges
5. `buildNavFromDirectory()` - 9 edges
6. `buildCollectionNavNode()` - 9 edges
7. `syncOfflineCacheIfNeeded()` - 9 edges
8. `buildPageTree()` - 9 edges
9. `main()` - 9 edges
10. `getHomeContent()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `generateStaticParams()` --calls--> `getAllSlugs()`  [INFERRED]
  C:\Users\Ashu\Documents\preplearn\app\templates\(docs)\[...slug]\page.tsx → C:\Users\Ashu\Documents\preplearn\features\mdx-parser\lib\content.ts
- `generateMetadata()` --calls--> `getPageBySlug()`  [INFERRED]
  C:\Users\Ashu\Documents\preplearn\app\templates\(docs)\[...slug]\page.tsx → C:\Users\Ashu\Documents\preplearn\features\mdx-parser\lib\content.ts
- `getPageBySlug()` --calls--> `shouldShowInBreadcrumb()`  [INFERRED]
  C:\Users\Ashu\Documents\preplearn\features\mdx-parser\lib\content.ts → C:\Users\Ashu\Documents\preplearn\features\mdx-parser\lib\display-title.ts
- `Home()` --calls--> `getHomeContent()`  [INFERRED]
  C:\Users\Ashu\Documents\preplearn\app\page.tsx → C:\Users\Ashu\Documents\preplearn\features\home\lib\content.ts
- `TemplatesCatalogPage()` --calls--> `getHomeContent()`  [INFERRED]
  C:\Users\Ashu\Documents\preplearn\app\templates\page.tsx → C:\Users\Ashu\Documents\preplearn\features\home\lib\content.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (23): deleteKV(), getDB(), getKV(), setKV(), isOfflineEnabled(), loadSearchIndex(), refreshSearchIndexIfNeeded(), clearStoredHashes() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (24): assertContentDir(), buildCollectionNavNode(), buildNavFromDirectory(), buildNavNodeFromSlugParts(), collectMarkdownFiles(), extractTitleFromBody(), filePathToSlug(), getAllSlugs() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.2
Nodes (22): buildFrontmatter(), buildPageTree(), collectMarkdownFiles(), fetchAllPageMeta(), fetchChildPageIdsFromBlocks(), getChildIds(), getFileNotionRootId(), getPageCover() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (13): buildSearchIndex(), excerpt(), compilePageMDX(), generateMetadata(), generateStaticParams(), TemplatesDocPage(), findChildByRelativeTarget(), normalizeRelativeTarget() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (12): assetsCacheName(), countCachedPages(), ensureVersions(), fetchManifest(), handleRequest(), isDocumentRequest(), isRscRequest(), matchCaches() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (8): buildCollectionFromPath(), extractDescription(), getHomeContent(), isCollectionRoot(), parseMdFile(), resolveChildItems(), Home(), TemplatesCatalogPage()

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (8): belongsToRootCollection(), getAllCollectionRoots(), getCollectionRootForSlug(), getCollectionRootSlug(), isCollectionRoot(), parseIndexMeta(), readRootIndexCollectionRoot(), slugToHref()

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (4): inferRoadmapCategory(), isDeepNotesCollection(), isStandalonePhaseNotes(), resolveRoadmapCategory()

### Community 8 - "Community 8"
Cohesion: 0.52
Nodes (6): buildPageContext(), extractEstimatedDays(), extractToc(), flattenNavLinks(), resolveRelatedSlugs(), slugToHeadingId()

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (5): formatSyncDate(), readSyncMeta(), upsertSyncRoot(), writeSyncMeta(), TemplatesShell()

### Community 10 - "Community 10"
Cohesion: 0.6
Nodes (5): shortBreadcrumbTitle(), shortNavTitle(), shouldShowInBreadcrumb(), stripDayRange(), stripLeadingIcon()

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (5): collectInternalLinks(), looksLikeDocHref(), main(), resolveLink(), stripCodeSegments()

### Community 12 - "Community 12"
Cohesion: 0.83
Nodes (3): buildOfflineManifest(), collectStaticAssets(), hashPayload()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (2): isExternalHref(), MdxLink()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 19`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `CategoryChips.tsx`, `CategoryChips()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `RoadmapCatalog.tsx`, `parseCategoryParam()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `SiteFooter.tsx`, `SiteFooter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `SiteHeader.tsx`, `SiteHeader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `NavSection.tsx`, `NavLink()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `SearchDialog.tsx`, `onKey()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `collection-client.ts`, `findActiveCollectionNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `AnimateIn()`, `AnimateIn.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `HomeHero.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `HowItWorks.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `RoadmapCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Breadcrumbs.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `MobileSidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `NavTree.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `TemplatePage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `search.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getPageBySlug()` connect `Community 1` to `Community 2`, `Community 3`, `Community 6`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `trimCollectionHubBody()` connect `Community 2` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `getPageBySlug()` (e.g. with `generateMetadata()` and `TemplatesDocPage()`) actually correct?**
  _`getPageBySlug()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `slugToFilePath()` (e.g. with `buildSearchIndex()` and `resolveLink()`) actually correct?**
  _`slugToFilePath()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._