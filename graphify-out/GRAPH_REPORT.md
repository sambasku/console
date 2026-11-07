# Graph Report - console  (2026-11-04)

## Corpus Check
- 465 files · ~216,608 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: (none) 5, .example 4, .mdc 3)

## Summary
- 2832 nodes · 8969 edges · 98 communities (94 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 178 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c2b4c80`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- notifications-page.tsx
- dashboard-page.tsx
- client.ts
- create-word.ts
- word-form-blocks.tsx
- router.tsx
- DataTable
- use-campaigns.ts
- create-word-page.tsx
- word-suggestion-detail-page.tsx
- abuse-page.tsx
- search-misses-page.tsx
- normalizeError
- places-page.tsx
- web-analytics-page.tsx
- formatDateTime
- web-analytics.ts
- play-analytics-page.tsx
- pronunciation-audio-api.ts
- contribution-review-panel.tsx
- users-page.tsx
- vote-moderation-page.tsx
- import-words-drawer.tsx
- audit-changes-cell.tsx
- audio-capture-ui.tsx
- application/correct-contribution.ts
- discussion-detail-page.tsx
- system-whatsapp-page.tsx
- contribution.ts
- word-groups-page.tsx
- vitest
- word-api.ts
- compilerOptions
- useDebouncedValue
- @tanstack/react-query
- package.json
- announcements-page.tsx
- client
- usaha-page.tsx
- @tanstack/react-router
- map-picker.tsx
- place-categories-page.tsx
- date-range.ts
- parse-import-csv.ts
- compilerOptions
- console-layout.tsx
- comment-blocklist-page.tsx
- use-legal.ts
- error.ts
- session.ts
- contribution-entity-view.tsx
- use-regions.ts
- verifier-application-detail-page.tsx
- word-comma-splits-panel.tsx
- encyclopedia-api.ts
- devDependencies
- contribution-mappers.ts
- use-api-clients.ts
- place-drawer.tsx
- events-page.tsx
- bug-report-api.ts
- import-sheet.tsx
- ColdHostGate
- system-email-page.tsx
- ApiOkEnvelope
- achievements-page.tsx
- TrendChart
- use-category-crud.ts
- top-pending-contributions-panel.tsx
- system-database-page.tsx
- use-culinary.ts
- use-vote-counts.ts
- culinary.ts
- user-info-modal.tsx
- dependencies
- scripts
- SambasKu Admin
- culinary-api.ts
- use-word-of-day.ts
- culinary-drawer.tsx
- culinary-proposal-drawer.tsx
- word-detail-page.tsx
- pantun-reports-page.tsx
- culinary-categories-page.tsx
- pantun-moderation-page.tsx
- import-attribution-fields.tsx
- mobile-release-page.tsx
- place-views-page.tsx
- provider-section.tsx
- refreshAccessTokenSingleFlight
- safe-audio-player.tsx
- MemoryStorage
- jwt.test.ts
- vite.config.ts
- blocklist-api.ts
- use-change-password.ts
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `normalizeError()` - 171 edges
2. `antd` - 146 edges
3. `PageHeader()` - 125 edges
4. `react` - 118 edges
5. `formatDateTime()` - 109 edges
6. `useAuth()` - 104 edges
7. `@tanstack/react-query` - 101 edges
8. `@ant-design/icons` - 89 edges
9. `client` - 64 edges
10. `DataTable()` - 54 edges

## Surprising Connections (you probably didn't know these)
- `GrowthTab()` --calls--> `TrendChart()`  [EXTRACTED]
  console/src/features/play-analytics/presentation/components/growth-tab.tsx → src/features/play-analytics/presentation/components/trend-chart.tsx
- `OverviewTab()` --calls--> `TrendChart()`  [EXTRACTED]
  console/src/features/play-analytics/presentation/components/overview-tab.tsx → src/features/play-analytics/presentation/components/trend-chart.tsx
- `FcmTrendChart()` --calls--> `formatYmd()`  [EXTRACTED]
  src/features/fcm-analytics/presentation/components/fcm-trend-chart.tsx → console/src/features/web-analytics/domain/date-range.ts
- `rootRoute` --calls--> `tryRestoreSession()`  [EXTRACTED]
  console/src/app/router.tsx → console/src/features/auth/application/try-restore-session.ts
- `useRestoreCuisine()` --indirect_call--> `restoreCuisineRequest()`  [INFERRED]
  console/src/features/culinary/application/use-culinary.ts → console/src/features/culinary/infrastructure/culinary-api.ts

## Import Cycles
- None detected.

## Communities (98 total, 4 thin omitted)

### Community 0 - "notifications-page.tsx"
Cohesion: 0.07
Nodes (66): describeFcmRequestError(), FcmView, resolveFcmView(), useFcmAnalytics(), DateRangeWire, FCM_SECTION_LABELS, FCM_SECTIONS, FcmDelivery (+58 more)

### Community 1 - "dashboard-page.tsx"
Cohesion: 0.05
Nodes (59): ensureDailyActivityLast30Days(), normalizeDashboardStats(), shiftCalendarDate(), wibDateString(), buildTodayVsYesterday(), formatDelta(), METRICS, TodayMetricKey (+51 more)

### Community 2 - "client.ts"
Cohesion: 0.09
Nodes (39): applyActiveTier(), authClient, BASE_CONFIG, OnAuthExpiredHandler, RefreshTokenResult, releaseCold(), RetryableRequestConfig, retryOnNextTier() (+31 more)

### Community 3 - "create-word.ts"
Cohesion: 0.09
Nodes (40): buildCreateWordBody(), buildExample(), buildImages(), buildInlineWord(), buildMeaningOverride(), buildMeanings(), buildPronunciation(), buildVariants() (+32 more)

### Community 4 - "word-form-blocks.tsx"
Cohesion: 0.05
Nodes (53): DefaultLanguageIds, mergeAudiosForExamples(), matchWordClassId(), isPlaceholder(), swapMeaningTexts(), AFFIX_TYPE_LABELS, AFFIX_TYPES, EXAMPLE_SOURCE_LABELS (+45 more)

### Community 5 - "router.tsx"
Cohesion: 0.03
Nodes (74): abuseLegacyRoute, abuseRoute, achievementsRoute, announcementsRoute, auditLogsRoute, baseLayoutRoute, bugReportsRoute, categoriesRoute (+66 more)

### Community 6 - "DataTable"
Cohesion: 0.08
Nodes (39): @tanstack/react-table, useCulinaryClaims(), useCulinaryReports(), useResolveCulinaryReport(), columnHelper, CulinaryClaimsPage(), STATUS_COLOR, STATUS_LABEL (+31 more)

### Community 7 - "use-campaigns.ts"
Cohesion: 0.07
Nodes (60): useCampaignDetail(), useCampaignList(), useCancelCampaign(), useCreateCampaign(), useCreateTemplate(), useDeleteTemplate(), useEstimateAudience(), useRetryCampaign() (+52 more)

### Community 8 - "create-word-page.tsx"
Cohesion: 0.14
Nodes (43): wordEntityToFormValues(), useDialectLabel(), CorrectContributionDrawer(), CorrectExampleForm(), CorrectMeaningForm(), CorrectPronunciationForm(), CorrectWordAudioForm(), CorrectWordForm() (+35 more)

### Community 9 - "word-suggestion-detail-page.tsx"
Cohesion: 0.07
Nodes (54): react-dom, BrushCursorOverlay(), CensorBrushMode, ImageCensorEditor(), ImageCensorEditorProps, isTypingTarget(), loadSourceCanvas(), useApproveWordSuggestion() (+46 more)

### Community 10 - "abuse-page.tsx"
Cohesion: 0.12
Nodes (42): AnonAbuseFilters, useAnonAbuseEvents(), useAnonMutes(), useLiftAnonMute(), useLiftUserMute(), UserAbuseFilters, useUserAbuseEvents(), useUserAbuseHistory() (+34 more)

### Community 11 - "search-misses-page.tsx"
Cohesion: 0.09
Nodes (40): TopSearchMissesPanelProps, normalizeSearchMissListItem(), useBulkDismissSearchMiss(), useDismissSearchMiss(), ResolveSearchMissVariables, useResolveSearchMiss(), useSearchMissList(), UseSearchMissListArgs (+32 more)

### Community 12 - "normalizeError"
Cohesion: 0.11
Nodes (44): @ant-design/icons, antd, react, AuditFilters, AuditLogsPage(), columnHelper, shortUlid(), BugReportsPage() (+36 more)

### Community 13 - "places-page.tsx"
Cohesion: 0.14
Nodes (30): useCreatePlace(), useDeletePlace(), usePlaceList(), usePlaceViews(), usePlaceViewsReport(), useUpdatePlace(), Place, createPlaceRequest() (+22 more)

### Community 14 - "web-analytics-page.tsx"
Cohesion: 0.24
Nodes (25): describeRequestError(), resolveProviderView(), useWebAnalytics(), PageRow, QueryRow, KpiGrid(), ProviderSection(), RequestErrorAlert() (+17 more)

### Community 15 - "formatDateTime"
Cohesion: 0.11
Nodes (28): useContributionList(), ContributionsPage(), contributionsRouteApi, isTypingTarget(), STATUS_TABS, StatusTab, LatestCommentsPanel(), LatestCommentsPanelProps (+20 more)

### Community 16 - "web-analytics.ts"
Cohesion: 0.09
Nodes (27): BreakdownRow, CHANNEL_LABELS, ChannelRow, EventRow, Ga4Behavior, Ga4Overview, Ga4Sources, Ga4Totals (+19 more)

### Community 17 - "play-analytics-page.tsx"
Cohesion: 0.11
Nodes (40): describePlayRequestError(), PlayView, resolvePlayView(), usePlayAnalytics(), DateRangeWire, PLAY_SECTION_LABELS, PLAY_SECTIONS, PlayCountryRow (+32 more)

### Community 18 - "pronunciation-audio-api.ts"
Cohesion: 0.16
Nodes (15): PendingExampleAudioDraft, uploadPendingAudiosAfterCreate(), UploadPendingAudiosResult, useDeletePronunciationAudio(), useUploadPronunciationAudio(), useWordDetail(), ACCEPTED_AUDIO, deletePronunciationAudioRequest() (+7 more)

### Community 19 - "contribution-review-panel.tsx"
Cohesion: 0.19
Nodes (14): adjacentPendingId(), nextPendingId(), ReviewCommitInput, useReopenContribution(), DEFAULT_REJECT_REASON_PRESET, REJECT_REASON_PRESET_IDS, REJECT_REASON_PRESETS, RejectReasonPresetId (+6 more)

### Community 20 - "users-page.tsx"
Cohesion: 0.13
Nodes (32): UpdateRoleVariables, useCreateAdminUser(), useSetCanContribute(), useSetUserActive(), useUpdateUserRole(), useVerifyUserEmail(), useUserAdminList(), UseUserAdminListArgs (+24 more)

### Community 21 - "vote-moderation-page.tsx"
Cohesion: 0.13
Nodes (32): useAdminVoteList(), UseAdminVoteListArgs, useDeleteAdminVote(), ResetTargetVotesArgs, useResetTargetVotes(), useTopTargetVotes(), normalizeAdminTopTarget(), normalizeAdminVoteListItem() (+24 more)

### Community 22 - "import-words-drawer.tsx"
Cohesion: 0.12
Nodes (28): ImportWordPayload, ImportWordResultItem, importWordsRequest(), saveWordImportSessionRequest(), activeMeanings(), applyResultCounters(), blankRows(), clearImportMarks() (+20 more)

### Community 23 - "audit-changes-cell.tsx"
Cohesion: 0.18
Nodes (16): useAuditLogList(), AuditChange, diffChanges(), formatValue(), stableStringify(), AUDIT_ACTION_TAG_COLOR, AUDIT_ACTIONS, AuditLogListItem (+8 more)

### Community 24 - "audio-capture-ui.tsx"
Cohesion: 0.11
Nodes (33): audioBufferToWavBlob(), decodeAudioBlob(), detectSpeechBounds(), extractWaveformPeaks(), sliceAudioBuffer(), SpeechBounds, trimAudioBlob(), TrimAudioResult (+25 more)

### Community 25 - "application/correct-contribution.ts"
Cohesion: 0.12
Nodes (28): buildCorrectContribution(), buildCorrectExampleBody(), buildCorrectMeaningBody(), buildCorrectPronunciationBody(), buildCorrectWordAudioBody(), buildCorrectWordBody(), buildCorrectWordImageBody(), CorrectDecisionExtra (+20 more)

### Community 26 - "discussion-detail-page.tsx"
Cohesion: 0.13
Nodes (33): useDiscussionDetail(), useDiscussionList(), invalidateAll(), useApproveDiscussion(), usePinDiscussionReply(), useRejectDiscussion(), useTakedownDiscussion(), useTakedownDiscussionReply() (+25 more)

### Community 27 - "system-whatsapp-page.tsx"
Cohesion: 0.18
Nodes (23): useWaLogs(), useWaMutations(), useWaTemplates(), useWaUsage(), WaLog, WaTemplate, WaTemplateParam, WaTestSendResult (+15 more)

### Community 28 - "contribution.ts"
Cohesion: 0.11
Nodes (18): ChildEntityLike, ChildEntityView, CONTRIBUTION_STATUS_LABELS, CONTRIBUTION_STATUSES, ContributionDetailPayload, ContributionDetailView, ContributionReview, ENTITY_TYPES (+10 more)

### Community 29 - "word-groups-page.tsx"
Cohesion: 0.13
Nodes (32): KEY, useAddWordGroupMember(), useAllWordGroups(), useCreateWordGroup(), useDeleteWordGroup(), usePickWords(), useRemoveWordGroupMember(), useUpdateWordGroup() (+24 more)

### Community 30 - "vitest"
Cohesion: 0.11
Nodes (29): vitest, audio(), enumOr(), example(), intOr(), intOrNull(), meaning(), normalizeWordDetail() (+21 more)

### Community 31 - "word-api.ts"
Cohesion: 0.09
Nodes (42): useBulkWordsAction(), useDeleteWord(), useDuplicateWordGroups(), useMergeDuplicateWords(), useWordList(), UseWordListArgs, usePublishWord(), useUnpublishWord() (+34 more)

### Community 32 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 33 - "useDebouncedValue"
Cohesion: 0.18
Nodes (13): useLookupLemmaDefinition(), useWordSearch(), UseWordSearchArgs, LemmaDefinitionEntry, LemmaDefinitionLookupResult, LemmaDefinitionSense, LemmaDefinitionSuggestion, lookupLemmaDefinitionRequest() (+5 more)

### Community 34 - "@tanstack/react-query"
Cohesion: 0.08
Nodes (37): @tanstack/react-query, queryClient, router, useApproveCommentImage(), UseCommentListArgs, useLatestComments(), useRejectCommentImage(), useTakedownComment() (+29 more)

### Community 35 - "package.json"
Cohesion: 0.12
Nodes (19): description, engines, node, name, private, type, version, eslint (+11 more)

### Community 36 - "announcements-page.tsx"
Cohesion: 0.19
Nodes (20): dayjs, useAnnouncementList(), useCreateAnnouncement(), useDeleteAnnouncement(), useUpdateAnnouncement(), ACTION_URL_ALLOWED_HOSTS, Announcement, AnnouncementBodyType (+12 more)

### Community 37 - "client"
Cohesion: 0.15
Nodes (22): ContributionListData, dropContributionFromListCaches(), invalidateContributionLists(), isContributionListQuery(), listAcceptsItem(), ListFilter, restoreContributionToListFront(), ALREADY_REVIEWED_CODE (+14 more)

### Community 38 - "usaha-page.tsx"
Cohesion: 0.05
Nodes (92): createUsahaCategoryItemRequest(), deleteUsahaCategoryItemRequest(), listUsahaCategoryItemsRequest(), mapItem(), updateUsahaCategoryItemRequest(), UsahaCategoryInput, useAllUsahaCategoryItems(), useCreateUsahaCategoryItem() (+84 more)

### Community 39 - "@tanstack/react-router"
Cohesion: 0.11
Nodes (32): @tanstack/react-router, useDismissWordReport(), useInvalidateReports(), useMarkWordReportCorrected(), useTakedownFromReport(), useWordReport(), useWordReportList(), noteRequired() (+24 more)

### Community 40 - "map-picker.tsx"
Cohesion: 0.18
Nodes (19): maplibre-gl, OPENFREEMAP_STYLE_BRIGHT, createPin(), DEFAULT_CENTER, MapPicker(), MapPickerProps, FieldProps, MapPointField() (+11 more)

### Community 41 - "place-categories-page.tsx"
Cohesion: 0.23
Nodes (17): useAllPlaceCategories(), useCreatePlaceCategory(), useDeletePlaceCategory(), useUpdatePlaceCategory(), PlaceCategoryItem, PlaceCategoryStatus, createPlaceCategoryRequest(), deletePlaceCategoryRequest() (+9 more)

### Community 42 - "date-range.ts"
Cohesion: 0.27
Nodes (10): PlayKpiItem, deltaTone, formatPercentChange(), parseTrafficSearch(), percentChange(), RANGE_PRESET_LABELS, toRangeQuery(), TrafficSearch (+2 more)

### Community 43 - "parse-import-csv.ts"
Cohesion: 0.15
Nodes (18): ARTI_CONTOH_HEADERS, cell(), DEFINITION_HEADERS, Delimiter, detectDelimiter(), EXAMPLE_HEADERS, headerKey(), importTemplateCsv() (+10 more)

### Community 44 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 45 - "console-layout.tsx"
Cohesion: 0.11
Nodes (28): activeTierSnapshot(), getForcedTierIndex(), setForcedTier(), subscribeTier(), tiers, ApiHostSwitcher(), forcedSnapshot(), hostnameOf() (+20 more)

### Community 46 - "comment-blocklist-page.tsx"
Cohesion: 0.35
Nodes (9): bulkResultTone(), formatBulkResultMessage(), detectDelimiter(), HEADER_LABELS, parseDelimited(), splitBlocklistText(), wordsFromWordlist(), columnHelper (+1 more)

### Community 47 - "use-legal.ts"
Cohesion: 0.22
Nodes (16): docsKey(), settingsKey, useLegalDocuments(), useLegalMutations(), AppSettingItem, AppSettingType, LegalDocument, LegalDocumentStatus (+8 more)

### Community 48 - "error.ts"
Cohesion: 0.17
Nodes (12): axios, base, ApiError, AuthExpiredError, isAuthExpiredError(), ApiErrorEnvelope, ApiFieldError, CursorMeta (+4 more)

### Community 49 - "session.ts"
Cohesion: 0.09
Nodes (33): consoleLayoutRoute, loginRoute, revokeUnauthorizedConsoleSession(), cachedUser, contributorUser, ensureConsoleRoleAllowed(), tryRestoreSession(), useLogin() (+25 more)

### Community 50 - "contribution-entity-view.tsx"
Cohesion: 0.21
Nodes (18): WordEntityView, ContributionEntityView(), DialectLabel, ENTITY_STATUS_TAG_COLOR, ExampleDetail(), MeaningDetail(), PairGrid(), PronunciationDetail() (+10 more)

### Community 51 - "use-regions.ts"
Cohesion: 0.20
Nodes (17): useAllRegions(), useCreateRegion(), useDeleteRegion(), useUpdateRegion(), Region, RegionStatus, RegionType, createRegionRequest() (+9 more)

### Community 52 - "verifier-application-detail-page.tsx"
Cohesion: 0.13
Nodes (26): ReviewVerifierApplicationResult, useReviewVerifierApplication(), VerifierApplicationDecision, useUpdateVerifierScreenshot(), useVerifierApplicationDetail(), useVerifierApplicationList(), ApproveVerifierApplicationResult, ListVerifierApplicationsParams (+18 more)

### Community 53 - "word-comma-splits-panel.tsx"
Cohesion: 0.29
Nodes (13): useApplyCommaSplit(), useCommaSplits(), useMarkCommaLiteral(), applyCommaSplitRequest(), listCommaSplitsRequest(), markCommaLiteralRequest(), blankExtra(), ExtraMeaning (+5 more)

### Community 54 - "encyclopedia-api.ts"
Cohesion: 0.06
Nodes (61): useAdminArticleList(), useArticleRevisions(), useCategoryOptions(), useCreateAdminArticle(), useDeleteAdminArticle(), useRestoreArticleRevision(), useUpdateAdminArticle(), AdminArticleDetail (+53 more)

### Community 55 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, prettier (+8 more)

### Community 56 - "contribution-mappers.ts"
Cohesion: 0.21
Nodes (22): AnyRecord, asString(), CHILD_FIELD_KEYS, fieldKeysFor(), isWordEntityPayload(), normalizeChildEntity(), normalizeContributionDetail(), normalizeContributionMeta() (+14 more)

### Community 57 - "use-api-clients.ts"
Cohesion: 0.24
Nodes (13): listKey, useApiClientMutations(), useApiClients(), ALL_SCOPES, ApiClient, ApiClientChannel, ApiClientScope, ApiClientStatus (+5 more)

### Community 58 - "place-drawer.tsx"
Cohesion: 0.18
Nodes (16): PlaceCategory, PlaceImage, PlaceImageAttribution, PlaceRelation, PlaceSource, PlaceStatus, PlaceType, PlaceWire (+8 more)

### Community 59 - "events-page.tsx"
Cohesion: 0.08
Nodes (55): useCreateEvent(), useDeleteEvent(), useEventCategories(), useEventList(), usePendingEventContributions(), useReviewEventContribution(), useSetEventCancelled(), useUpdateEvent() (+47 more)

### Community 60 - "bug-report-api.ts"
Cohesion: 0.23
Nodes (12): useBugReportList(), useResolveBugReport(), BUG_REPORT_STATUS_LABELS, BUG_REPORT_STATUS_TAG_COLOR, BUG_REPORT_STATUSES, BugReportImage, BugReportListItem, BugReportStatus (+4 more)

### Community 61 - "import-sheet.tsx"
Cohesion: 0.20
Nodes (14): ACTION_WIDTH, ColId, colWidth(), DEFAULT_TEXT_WIDTH, fitTextarea(), ImportSheet(), isTextCol(), loadTextWidths() (+6 more)

### Community 62 - "ColdHostGate"
Cohesion: 0.18
Nodes (5): abortError(), AbortLike, COLD_HOST_MAX_IN_FLIGHT, ColdHostGate, Waiter

### Community 63 - "system-email-page.tsx"
Cohesion: 0.34
Nodes (10): useEmailLogs(), useEmailQuotas(), EmailLog, EmailLogStatus, EmailQuota, listEmailLogsRequest(), listEmailQuotasRequest(), CATEGORY_LABELS (+2 more)

### Community 64 - "ApiOkEnvelope"
Cohesion: 0.19
Nodes (13): uploadCampaignImage(), uploadPlaceImage(), ACCEPTED, PlaceImagesField(), useUploadWordImage(), UploadedImage, uploadWordImage(), ApiCursorPageEnvelope (+5 more)

### Community 65 - "achievements-page.tsx"
Cohesion: 0.11
Nodes (41): useAchievementList(), useCreateAchievement(), useDeleteAchievement(), useGrantAchievement(), usePreviewAchievement(), useRecipients(), useRevokeAward(), useScanAchievement() (+33 more)

### Community 66 - "TrendChart"
Cohesion: 0.22
Nodes (12): @ant-design/plots, ChartRow, dayLabel(), PlayTrendChartProps, PlayTrendSeries, TrendChart(), formatYmd(), ChartRow (+4 more)

### Community 67 - "use-category-crud.ts"
Cohesion: 0.24
Nodes (10): CategoryInput, createCategoryRequest(), deleteCategoryRequest(), listCategoriesRequest(), updateCategoryRequest(), useCategoryList(), useCreateCategory(), useDeleteCategory() (+2 more)

### Community 68 - "top-pending-contributions-panel.tsx"
Cohesion: 0.27
Nodes (8): UseContributionListArgs, useTopPendingContributions(), ContributionStatus, ENTITY_TYPE_LABELS, listContributionsRequest(), titleFor(), TopPendingContributionsPanel(), TopPendingContributionsPanelProps

### Community 69 - "system-database-page.tsx"
Cohesion: 0.23
Nodes (17): listKey, useDatabaseBackupLogs(), useTriggerDatabaseBackup(), BackupLogListResult, DatabaseBackupLog, DatabaseBackupLogStatus, isBackupActive(), TriggerBackupResult (+9 more)

### Community 70 - "use-culinary.ts"
Cohesion: 0.12
Nodes (32): useCreateCuisine(), useCreatePlace(), useCuisines(), useCulinaryPlaces(), useDeleteCuisine(), useDeletePlace(), usePendingCulinaryContributions(), useRestoreCuisine() (+24 more)

### Community 71 - "use-vote-counts.ts"
Cohesion: 0.34
Nodes (10): isVoteCountsReader(), sumVoteCounts(), toVoteCountMap(), useVoteCounts(), VoteCountsMap, buildTargetsQuery(), MAX_VOTE_TARGETS, VoteCountsItem (+2 more)

### Community 72 - "culinary.ts"
Cohesion: 0.11
Nodes (22): useReviewCulinaryClaim(), Cuisine, CuisinePlaceLink, CulinaryAvailability, CulinaryClaim, CulinaryClaimStatus, CulinaryDuplicateCandidate, CulinaryImageAttribution (+14 more)

### Community 73 - "user-info-modal.tsx"
Cohesion: 0.19
Nodes (16): kindLabel(), ROLE_LABELS, roleLabel(), UserInfoLinkProps, UserInfoModal(), UserInfoModalProps, getPublicActivityRequest(), getPublicProfileRequest() (+8 more)

### Community 74 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, @ant-design/icons, @ant-design/plots, antd, axios, dayjs, maplibre-gl, react (+4 more)

### Community 75 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, build:staging, dev, format, lint, lint:fix, preview (+4 more)

### Community 76 - "SambasKu Admin"
Cohesion: 0.15
Nodes (12): Aset media, Deploy Production, Deploy Staging, Dikerjakan dengan AI, Fitur utama, Kenapa custom domain wajib, Routing SPA, SambasKu Admin (+4 more)

### Community 77 - "culinary-api.ts"
Cohesion: 0.19
Nodes (18): CulinaryCategoryRef, CulinaryImage, createCuisineRequest(), createPlaceRequest(), CuisineWire, CulinaryKind, listCuisinesRequest(), listPlacesRequest() (+10 more)

### Community 78 - "use-word-of-day.ts"
Cohesion: 0.27
Nodes (9): firstSense(), normalize(), useWordOfDay(), WordOfDay, getWordOfDayRequest(), WordOfDayMeaningWire, WordOfDayWire, WordOfDayCard() (+1 more)

### Community 79 - "culinary-drawer.tsx"
Cohesion: 0.24
Nodes (17): useCulinaryCategories(), CulinaryPlace, CulinaryPlaceType, CulinaryPublishStatus, CuisineInput, CulinaryListParams, listCulinaryCategoriesRequest(), PlaceInput (+9 more)

### Community 80 - "culinary-proposal-drawer.tsx"
Cohesion: 0.19
Nodes (16): useCulinaryContributions(), CulinaryContribution, CulinaryContributionKind, CulinaryContributionStatus, ContributionWire, CULINARY_CONTRIBUTION_KIND_LABEL, CULINARY_CONTRIBUTION_REJECT_REASON_OPTIONS, CULINARY_CONTRIBUTION_STATUS_LABEL (+8 more)

### Community 81 - "word-detail-page.tsx"
Cohesion: 0.22
Nodes (15): AuditTimeline(), WordComments(), useRestoreWord(), useTakedownWord(), restoreWordRequest(), takedownWordRequest(), STATUS_TAG_COLOR, StatusTag() (+7 more)

### Community 82 - "pantun-reports-page.tsx"
Cohesion: 0.22
Nodes (15): usePantunReports(), useResolvePantunReport(), listPantunReportsRequest(), PANTUN_REPORT_REASON_LABEL, PANTUN_REPORT_TARGET_LABEL, PantunReport, PantunReportResolution, PantunReportStatus (+7 more)

### Community 83 - "culinary-categories-page.tsx"
Cohesion: 0.26
Nodes (15): createCulinaryCategoryItemRequest(), CulinaryCategoryInput, deleteCulinaryCategoryItemRequest(), listCulinaryCategoryItemsRequest(), mapItem(), updateCulinaryCategoryItemRequest(), useAllCulinaryCategoryItems(), useCreateCulinaryCategoryItem() (+7 more)

### Community 84 - "pantun-moderation-page.tsx"
Cohesion: 0.23
Nodes (11): usePantuns(), useTakedownPantun(), listPantunsRequest(), PantunRow, PantunWire, takedownPantunRequest(), columnHelper, PantunModerationPage() (+3 more)

### Community 85 - "import-attribution-fields.tsx"
Cohesion: 0.22
Nodes (10): listAdminUsersRequest(), listWordImportSessionsRequest(), WordImportSupportType, EMPTY_IMPORT_SUPPORT, HistoryOption, ImportAttributionFields(), ImportSupportDraft, SUPPORT_TYPE_LABEL (+2 more)

### Community 86 - "mobile-release-page.tsx"
Cohesion: 0.33
Nodes (10): listKey, useMobileReleases(), useUpsertMobileRelease(), MobileRelease, MobileReleasePlatform, listMobileReleasesRequest(), mapRelease(), upsertMobileReleaseRequest() (+2 more)

### Community 87 - "place-views-page.tsx"
Cohesion: 0.36
Nodes (7): fillTrendDays(), PlaceViewsKpis, toPlaceViewsKpis(), PlaceViewsReport, PERIODS, PlaceViewsPage(), report

### Community 88 - "provider-section.tsx"
Cohesion: 0.32
Nodes (7): ProviderView, DateRangeWire, DefaultSkeleton(), ProviderSectionProps, SetupModal(), Source, SOURCE_COPY

### Community 91 - "safe-audio-player.tsx"
Cohesion: 0.36
Nodes (6): FailKind, SafeAudioPlayerProps, SafeAudioPlayerSession(), LEGACY_JSDELIVR_HOSTS, publicAudioUrlCandidates(), resolvePublicAudioUrl()

### Community 93 - "jwt.test.ts"
Cohesion: 0.38
Nodes (4): RFC-4648, base64UrlDecode(), decodeJwtClaims(), JwtClaims

### Community 94 - "vite.config.ts"
Cohesion: 0.33
Nodes (4): vite, @vitejs/plugin-react, consoleRoot, repoRoot

### Community 96 - "blocklist-api.ts"
Cohesion: 0.32
Nodes (8): useBlocklistList(), useBulkCreateBlocklistWords(), useDeleteBlocklistWord(), BlocklistWordItem, BulkBlocklistResult, bulkCreateBlocklistRequest(), deleteBlocklistRequest(), listBlocklistRequest()

### Community 98 - "use-change-password.ts"
Cohesion: 0.70
Nodes (3): useChangePassword(), ChangePasswordInput, changePasswordRequest()

## Knowledge Gaps
- **577 isolated node(s):** `name`, `version`, `description`, `type`, `private` (+572 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 626 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `antd` connect `normalizeError` to `notifications-page.tsx`, `dashboard-page.tsx`, `client.ts`, `word-form-blocks.tsx`, `router.tsx`, `DataTable`, `use-campaigns.ts`, `create-word-page.tsx`, `word-suggestion-detail-page.tsx`, `abuse-page.tsx`, `search-misses-page.tsx`, `places-page.tsx`, `web-analytics-page.tsx`, `formatDateTime`, `play-analytics-page.tsx`, `contribution-review-panel.tsx`, `users-page.tsx`, `vote-moderation-page.tsx`, `import-words-drawer.tsx`, `audit-changes-cell.tsx`, `audio-capture-ui.tsx`, `discussion-detail-page.tsx`, `system-whatsapp-page.tsx`, `word-groups-page.tsx`, `word-api.ts`, `useDebouncedValue`, `@tanstack/react-query`, `package.json`, `announcements-page.tsx`, `client`, `usaha-page.tsx`, `@tanstack/react-router`, `map-picker.tsx`, `place-categories-page.tsx`, `console-layout.tsx`, `comment-blocklist-page.tsx`, `session.ts`, `contribution-entity-view.tsx`, `verifier-application-detail-page.tsx`, `word-comma-splits-panel.tsx`, `encyclopedia-api.ts`, `place-drawer.tsx`, `events-page.tsx`, `import-sheet.tsx`, `system-email-page.tsx`, `ApiOkEnvelope`, `achievements-page.tsx`, `TrendChart`, `top-pending-contributions-panel.tsx`, `system-database-page.tsx`, `use-culinary.ts`, `use-vote-counts.ts`, `user-info-modal.tsx`, `use-word-of-day.ts`, `culinary-drawer.tsx`, `culinary-proposal-drawer.tsx`, `word-detail-page.tsx`, `pantun-reports-page.tsx`, `culinary-categories-page.tsx`, `pantun-moderation-page.tsx`, `import-attribution-fields.tsx`, `mobile-release-page.tsx`, `place-views-page.tsx`, `provider-section.tsx`, `safe-audio-player.tsx`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `@tanstack/react-query` connect `@tanstack/react-query` to `notifications-page.tsx`, `dashboard-page.tsx`, `use-campaigns.ts`, `create-word-page.tsx`, `word-suggestion-detail-page.tsx`, `abuse-page.tsx`, `search-misses-page.tsx`, `normalizeError`, `places-page.tsx`, `web-analytics-page.tsx`, `formatDateTime`, `web-analytics.ts`, `play-analytics-page.tsx`, `pronunciation-audio-api.ts`, `contribution-review-panel.tsx`, `users-page.tsx`, `vote-moderation-page.tsx`, `import-words-drawer.tsx`, `discussion-detail-page.tsx`, `system-whatsapp-page.tsx`, `word-groups-page.tsx`, `vitest`, `word-api.ts`, `useDebouncedValue`, `package.json`, `announcements-page.tsx`, `client`, `usaha-page.tsx`, `@tanstack/react-router`, `place-categories-page.tsx`, `use-legal.ts`, `error.ts`, `session.ts`, `use-regions.ts`, `verifier-application-detail-page.tsx`, `word-comma-splits-panel.tsx`, `encyclopedia-api.ts`, `contribution-mappers.ts`, `use-api-clients.ts`, `events-page.tsx`, `bug-report-api.ts`, `system-email-page.tsx`, `achievements-page.tsx`, `use-category-crud.ts`, `top-pending-contributions-panel.tsx`, `system-database-page.tsx`, `use-culinary.ts`, `use-vote-counts.ts`, `user-info-modal.tsx`, `use-word-of-day.ts`, `word-detail-page.tsx`, `pantun-reports-page.tsx`, `culinary-categories-page.tsx`, `pantun-moderation-page.tsx`, `mobile-release-page.tsx`, `blocklist-api.ts`, `use-change-password.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `react` connect `normalizeError` to `notifications-page.tsx`, `dashboard-page.tsx`, `word-form-blocks.tsx`, `DataTable`, `use-campaigns.ts`, `create-word-page.tsx`, `word-suggestion-detail-page.tsx`, `abuse-page.tsx`, `search-misses-page.tsx`, `places-page.tsx`, `web-analytics-page.tsx`, `formatDateTime`, `play-analytics-page.tsx`, `contribution-review-panel.tsx`, `users-page.tsx`, `vote-moderation-page.tsx`, `import-words-drawer.tsx`, `audit-changes-cell.tsx`, `audio-capture-ui.tsx`, `discussion-detail-page.tsx`, `system-whatsapp-page.tsx`, `word-groups-page.tsx`, `word-api.ts`, `useDebouncedValue`, `@tanstack/react-query`, `package.json`, `announcements-page.tsx`, `client`, `usaha-page.tsx`, `@tanstack/react-router`, `map-picker.tsx`, `place-categories-page.tsx`, `console-layout.tsx`, `comment-blocklist-page.tsx`, `error.ts`, `contribution-entity-view.tsx`, `verifier-application-detail-page.tsx`, `word-comma-splits-panel.tsx`, `encyclopedia-api.ts`, `place-drawer.tsx`, `events-page.tsx`, `import-sheet.tsx`, `system-email-page.tsx`, `ApiOkEnvelope`, `achievements-page.tsx`, `TrendChart`, `system-database-page.tsx`, `use-culinary.ts`, `user-info-modal.tsx`, `culinary-drawer.tsx`, `culinary-proposal-drawer.tsx`, `word-detail-page.tsx`, `pantun-reports-page.tsx`, `culinary-categories-page.tsx`, `pantun-moderation-page.tsx`, `import-attribution-fields.tsx`, `mobile-release-page.tsx`, `place-views-page.tsx`, `provider-section.tsx`, `safe-audio-player.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _577 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `notifications-page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0653417645287564 - nodes in this community are weakly interconnected._
- **Should `dashboard-page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05379746835443038 - nodes in this community are weakly interconnected._
- **Should `client.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._