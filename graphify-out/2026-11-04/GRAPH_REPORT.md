# Graph Report - console  (2026-10-21)

## Corpus Check
- 396 files · ~176,132 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .example 4, .mdc 3)

## Summary
- 2267 nodes · 7036 edges · 101 communities (98 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `757a8728`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- notifications-page.tsx
- dashboard-page.tsx
- client.ts
- create-word.ts
- word-form-blocks.tsx
- router.tsx
- PageHeader
- use-campaigns.ts
- create-word-page.tsx
- word-suggestion-detail-page.tsx
- abuse-page.tsx
- search-miss-api.ts
- normalizeError
- places-page.tsx
- search-tab.tsx
- antd
- web-analytics.ts
- play-analytics-page.tsx
- types.ts
- contribution-review-panel.tsx
- user-admin-api.ts
- vote-admin-api.ts
- import-words-drawer.tsx
- audit-logs-page.tsx
- audio-capture-ui.tsx
- application/correct-contribution.ts
- discussion-api.ts
- system-whatsapp-page.tsx
- contribution.ts
- use-word-groups.ts
- vitest
- word-api.ts
- compilerOptions
- react
- word-comments.tsx
- package.json
- announcement-api.ts
- review-submit-queue.ts
- play-analytics.ts
- word-reports-page.tsx
- map-picker.tsx
- place-categories-page.tsx
- web-analytics-page.tsx
- parse-import-csv.ts
- compilerOptions
- console-layout.tsx
- comment-blocklist-page.tsx
- use-legal.ts
- useCursorList
- user.ts
- contribution-entity-view.tsx
- region-api.ts
- verifier-application.ts
- word-comma-splits-panel.tsx
- word-images-field.tsx
- devDependencies
- contribution-mappers.ts
- use-api-clients.ts
- place-drawer.tsx
- session.ts
- bug-report.ts
- import-sheet.tsx
- ColdHostGate
- system-email-page.tsx
- compressImageForUpload
- audio-trim-editor.tsx
- web-analytics/presentation/components/trend-chart.tsx
- use-category-crud.ts
- top-pending-contributions-panel.tsx
- database-backup-api.ts
- supabase-health-api.ts
- use-vote-counts.ts
- word-report-detail-page.tsx
- use-public-profile.ts
- dependencies
- scripts
- SambasKu Admin
- try-restore-session.ts
- use-word-of-day.ts
- words-page.tsx
- ApiError
- word.ts
- vote-moderation-page.tsx
- word-groups-page.tsx
- WordClassOption
- import-attribution-fields.tsx
- @tanstack/react-query
- system-database-page.tsx
- system-supabase-page.tsx
- use-review-verifier-application.ts
- lemma-definition-api.ts
- safe-audio-player.tsx
- MemoryStorage
- jwt.test.ts
- vite.config.ts
- image-censor-editor.tsx
- use-blocklist-mutations.ts
- use-word-publish.ts
- use-change-password.ts
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `antd` - 119 edges
2. `normalizeError()` - 112 edges
3. `react` - 91 edges
4. `PageHeader()` - 89 edges
5. `@tanstack/react-query` - 83 edges
6. `useAuth()` - 81 edges
7. `formatDateTime()` - 74 edges
8. `@ant-design/icons` - 66 edges
9. `client` - 47 edges
10. `ApiOkEnvelope` - 41 edges

## Surprising Connections (you probably didn't know these)
- `useCreateRegion()` --indirect_call--> `createRegionRequest()`  [INFERRED]
  src/features/regions/application/use-regions.ts → src/features/regions/infrastructure/region-api.ts
- `useCreateWordGroup()` --indirect_call--> `createWordGroupRequest()`  [INFERRED]
  src/features/word-groups/application/use-word-groups.ts → src/features/word-groups/infrastructure/word-group-api.ts
- `rootRoute` --calls--> `tryRestoreSession()`  [EXTRACTED]
  src/app/router.tsx → src/features/auth/application/try-restore-session.ts
- `useUserAbuseEvents()` --calls--> `useCursorList()`  [EXTRACTED]
  src/features/abuse/application/use-abuse.ts → src/shared/hooks/use-cursor-list.ts
- `useAnonAbuseEvents()` --calls--> `useCursorList()`  [EXTRACTED]
  src/features/abuse/application/use-abuse.ts → src/shared/hooks/use-cursor-list.ts

## Import Cycles
- None detected.

## Communities (101 total, 3 thin omitted)

### Community 0 - "notifications-page.tsx"
Cohesion: 0.07
Nodes (66): describeFcmRequestError(), FcmView, resolveFcmView(), useFcmAnalytics(), DateRangeWire, FCM_SECTION_LABELS, FCM_SECTIONS, FcmDelivery (+58 more)

### Community 1 - "dashboard-page.tsx"
Cohesion: 0.06
Nodes (53): ensureDailyActivityLast30Days(), normalizeDashboardStats(), shiftCalendarDate(), wibDateString(), buildTodayVsYesterday(), formatDelta(), METRICS, TodayMetricKey (+45 more)

### Community 2 - "client.ts"
Cohesion: 0.07
Nodes (52): axios, applyActiveTier(), BASE_CONFIG, OnAuthExpiredHandler, RefreshTokenResult, releaseCold(), RetryableRequestConfig, retryOnNextTier() (+44 more)

### Community 3 - "create-word.ts"
Cohesion: 0.07
Nodes (54): buildCreateWordBody(), buildExample(), buildImages(), buildInlineWord(), buildMeaningOverride(), buildMeanings(), buildPronunciation(), buildVariants() (+46 more)

### Community 4 - "word-form-blocks.tsx"
Cohesion: 0.06
Nodes (53): mergeAudiosForExamples(), isPlaceholder(), swapMeaningTexts(), AFFIX_TYPE_LABELS, AFFIX_TYPES, EXAMPLE_SOURCE_LABELS, EXAMPLE_SOURCE_TYPES, RELATION_TYPE_LABELS (+45 more)

### Community 5 - "router.tsx"
Cohesion: 0.04
Nodes (55): abuseLegacyRoute, abuseRoute, announcementsRoute, auditLogsRoute, baseLayoutRoute, bugReportsRoute, categoriesRoute, commentBlocklistRoute (+47 more)

### Community 6 - "PageHeader"
Cohesion: 0.08
Nodes (47): @tanstack/react-router, @tanstack/react-table, platformLabel(), BugReportsPage(), columnHelper, STATUS_TABS, StatusTab, columnHelper (+39 more)

### Community 7 - "use-campaigns.ts"
Cohesion: 0.11
Nodes (46): useCampaignDetail(), useCampaignList(), useCancelCampaign(), useCreateCampaign(), useCreateTemplate(), useDeleteTemplate(), useEstimateAudience(), useRetryCampaign() (+38 more)

### Community 8 - "create-word-page.tsx"
Cohesion: 0.12
Nodes (46): wordEntityToFormValues(), useDialectLabel(), CorrectContributionDrawer(), CorrectExampleForm(), CorrectMeaningForm(), CorrectPronunciationForm(), CorrectWordAudioForm(), CorrectWordForm() (+38 more)

### Community 9 - "word-suggestion-detail-page.tsx"
Cohesion: 0.09
Nodes (43): useApproveWordSuggestion(), useRejectWordSuggestion(), useWordSuggestionDetail(), useWordSuggestionList(), asRecord(), describeMeaning(), describeSuggestionChanges(), DescribeSuggestionInput (+35 more)

### Community 10 - "abuse-page.tsx"
Cohesion: 0.12
Nodes (42): AnonAbuseFilters, useAnonAbuseEvents(), useAnonMutes(), useLiftAnonMute(), useLiftUserMute(), UserAbuseFilters, useUserAbuseEvents(), useUserAbuseHistory() (+34 more)

### Community 11 - "search-miss-api.ts"
Cohesion: 0.09
Nodes (36): TopSearchMissesPanelProps, normalizeSearchMissListItem(), useBulkDismissSearchMiss(), useDismissSearchMiss(), ResolveSearchMissVariables, useResolveSearchMiss(), useSearchMissList(), UseSearchMissListArgs (+28 more)

### Community 12 - "normalizeError"
Cohesion: 0.14
Nodes (28): @ant-design/icons, AnnouncementDrawer(), AnnouncementsPage(), formatEpoch(), FormValues, useLegalSettings(), LegalPage(), STATUS_COLOR (+20 more)

### Community 13 - "places-page.tsx"
Cohesion: 0.13
Nodes (33): useCreatePlace(), useDeletePlace(), usePlaceList(), useUpdatePlace(), Place, PlaceCategory, PlaceImage, PlaceImageAttribution (+25 more)

### Community 14 - "search-tab.tsx"
Cohesion: 0.23
Nodes (26): resolveProviderView(), useWebAnalytics(), PageRow, QueryRow, RangeQuery, getWebAnalyticsRequest(), KpiGrid(), ProviderSection() (+18 more)

### Community 15 - "antd"
Cohesion: 0.11
Nodes (23): antd, contributionsRouteApi, STATUS_TABS, StatusTab, LatestCommentsPanel(), LatestCommentsPanelProps, REJECT_REASONS, TYPE_LABEL (+15 more)

### Community 16 - "web-analytics.ts"
Cohesion: 0.08
Nodes (30): describeRequestError(), ProviderView, BreakdownRow, CHANNEL_LABELS, ChannelRow, DateRangeWire, EventRow, Ga4Behavior (+22 more)

### Community 17 - "play-analytics-page.tsx"
Cohesion: 0.19
Nodes (23): describePlayRequestError(), PlayView, resolvePlayView(), usePlayAnalytics(), DateRangeWire, RangeQuery, COUNTRY_LABELS, fmtInt() (+15 more)

### Community 18 - "types.ts"
Cohesion: 0.17
Nodes (15): approveContributionRequest(), useUpdateVerifierScreenshot(), updateVerifierScreenshotRequest(), WordOfDayMeaningWire, approveWordSuggestionRequest(), ACCEPTED_AUDIO, UploadedPronunciationAudio, buildCensoredApproveFormData() (+7 more)

### Community 19 - "contribution-review-panel.tsx"
Cohesion: 0.12
Nodes (24): adjacentPendingId(), nextPendingId(), ReviewCommitInput, useContributionDetail(), useReopenContribution(), CONTRIBUTION_STATUS_LABELS, WordImageView, DEFAULT_REJECT_REASON_PRESET (+16 more)

### Community 20 - "user-admin-api.ts"
Cohesion: 0.13
Nodes (25): UpdateRoleVariables, useCreateAdminUser(), useSetCanContribute(), useUserAdminList(), UseUserAdminListArgs, normalizeAdminUserListItem(), AdminUserListItem, AdminUserRole (+17 more)

### Community 21 - "vote-admin-api.ts"
Cohesion: 0.14
Nodes (24): useAdminVoteList(), UseAdminVoteListArgs, useDeleteAdminVote(), ResetTargetVotesArgs, useResetTargetVotes(), useTopTargetVotes(), normalizeAdminTopTarget(), normalizeAdminVoteListItem() (+16 more)

### Community 22 - "import-words-drawer.tsx"
Cohesion: 0.12
Nodes (28): ImportWordPayload, ImportWordResultItem, importWordsRequest(), saveWordImportSessionRequest(), activeMeanings(), applyResultCounters(), blankRows(), clearImportMarks() (+20 more)

### Community 23 - "audit-logs-page.tsx"
Cohesion: 0.15
Nodes (22): useAuditLogList(), AuditChange, diffChanges(), formatValue(), stableStringify(), AUDIT_ACTION_TAG_COLOR, AUDIT_ACTIONS, AuditLogListItem (+14 more)

### Community 24 - "audio-capture-ui.tsx"
Cohesion: 0.12
Nodes (27): AudioRecorderState, blobToAudioFile(), extensionForAudioMime(), formatRecordingClock(), MAX_RECORDING_SECONDS, MIME_CANDIDATES, normalizeAudioMime(), pickSupportedMime() (+19 more)

### Community 25 - "application/correct-contribution.ts"
Cohesion: 0.14
Nodes (25): buildCorrectContribution(), buildCorrectExampleBody(), buildCorrectMeaningBody(), buildCorrectPronunciationBody(), buildCorrectWordAudioBody(), buildCorrectWordBody(), buildCorrectWordImageBody(), CorrectDecisionExtra (+17 more)

### Community 26 - "discussion-api.ts"
Cohesion: 0.15
Nodes (24): useDiscussionDetail(), useDiscussionList(), invalidateAll(), useApproveDiscussion(), usePinDiscussionReply(), useRejectDiscussion(), useTakedownDiscussion(), useTakedownDiscussionReply() (+16 more)

### Community 27 - "system-whatsapp-page.tsx"
Cohesion: 0.18
Nodes (23): useWaLogs(), useWaMutations(), useWaTemplates(), useWaUsage(), WaLog, WaTemplate, WaTemplateParam, WaTestSendResult (+15 more)

### Community 28 - "contribution.ts"
Cohesion: 0.10
Nodes (21): ChildEntityLike, ChildEntityView, CONTRIBUTION_STATUSES, ContributionDetailPayload, ContributionDetailView, ContributionReview, ENTITY_TYPES, ExampleChildData (+13 more)

### Community 29 - "use-word-groups.ts"
Cohesion: 0.15
Nodes (23): KEY, useDeleteWordGroup(), useRemoveWordGroupMember(), WORD_GROUP_STATUS_LABELS, WordGroupInput, WordGroupItem, WordGroupMember, WordGroupStatus (+15 more)

### Community 30 - "vitest"
Cohesion: 0.17
Nodes (19): vitest, audio(), enumOr(), example(), intOr(), intOrNull(), meaning(), normalizeWordDetail() (+11 more)

### Community 31 - "word-api.ts"
Cohesion: 0.13
Nodes (19): useBulkWordsAction(), useDeleteWord(), useMergeDuplicateWords(), useImportSession(), WordListItem, BulkWordsAction, bulkWordsActionRequest(), BulkWordsItemResult (+11 more)

### Community 32 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 33 - "react"
Cohesion: 0.15
Nodes (18): react, useImportSessionList(), LemmaDefinitionSuggestion, claimWordImportSessionRequest(), rollbackWordImportSessionRequest(), WordImportSessionStatus, SUPPORT_TYPE_LABEL, ImportHistoryDetailPage() (+10 more)

### Community 34 - "word-comments.tsx"
Cohesion: 0.23
Nodes (15): useLatestComments(), useTakedownComment(), useUncensorComment(), useWordComments(), AdminCommentItem, COMMENT_STATUS_LABELS, COMMENT_STATUS_TAG_COLOR, COMMENT_STATUSES (+7 more)

### Community 35 - "package.json"
Cohesion: 0.11
Nodes (20): description, engines, node, name, private, type, version, eslint (+12 more)

### Community 36 - "announcement-api.ts"
Cohesion: 0.19
Nodes (17): dayjs, useAnnouncementList(), useCreateAnnouncement(), useDeleteAnnouncement(), useUpdateAnnouncement(), ACTION_URL_ALLOWED_HOSTS, Announcement, AnnouncementBodyType (+9 more)

### Community 37 - "review-submit-queue.ts"
Cohesion: 0.20
Nodes (16): ContributionListData, dropContributionFromListCaches(), invalidateContributionLists(), isContributionListQuery(), listAcceptsItem(), ListFilter, restoreContributionToListFront(), ALREADY_REVIEWED_CODE (+8 more)

### Community 38 - "play-analytics.ts"
Cohesion: 0.17
Nodes (18): PLAY_SECTION_LABELS, PLAY_SECTIONS, PlayCountryRow, PlayGrowth, PlayOverview, PlayProviderResult, PlayRatingBucket, PlayRatings (+10 more)

### Community 39 - "word-reports-page.tsx"
Cohesion: 0.18
Nodes (16): useWordReportList(), WORD_REPORT_RESOLUTION_LABELS, WORD_REPORT_RESOLUTIONS, WORD_REPORT_STATUS_LABELS, WORD_REPORT_STATUSES, WordReportListItem, WordReportResolution, WordReportStatus (+8 more)

### Community 40 - "map-picker.tsx"
Cohesion: 0.21
Nodes (16): OPENFREEMAP_STYLE_BRIGHT, createPin(), DEFAULT_CENTER, MapPicker(), MapPickerProps, FieldProps, getJson(), MapBias (+8 more)

### Community 41 - "place-categories-page.tsx"
Cohesion: 0.23
Nodes (16): useCreatePlaceCategory(), useDeletePlaceCategory(), useUpdatePlaceCategory(), PlaceCategoryItem, PlaceCategoryStatus, createPlaceCategoryRequest(), deletePlaceCategoryRequest(), listAllPlaceCategoriesRequest() (+8 more)

### Community 42 - "web-analytics-page.tsx"
Cohesion: 0.20
Nodes (15): PlayKpiItem, deltaTone, formatPercentChange(), parseTrafficSearch(), percentChange(), RANGE_PRESET_LABELS, toRangeQuery(), TrafficSearch (+7 more)

### Community 43 - "parse-import-csv.ts"
Cohesion: 0.15
Nodes (18): ARTI_CONTOH_HEADERS, cell(), DEFINITION_HEADERS, Delimiter, detectDelimiter(), EXAMPLE_HEADERS, headerKey(), importTemplateCsv() (+10 more)

### Community 44 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 45 - "console-layout.tsx"
Cohesion: 0.12
Nodes (18): ROLE_LABELS, UserRole, ANALYTICS_ROUTES, AnalyticsRoute, BREADCRUMB_LABELS, ConsoleLayout(), EKSPLORASI_ROUTES, EksplorasiRoute (+10 more)

### Community 46 - "comment-blocklist-page.tsx"
Cohesion: 0.25
Nodes (13): bulkResultTone(), formatBulkResultMessage(), detectDelimiter(), HEADER_LABELS, parseDelimited(), splitBlocklistText(), wordsFromWordlist(), useBlocklistList() (+5 more)

### Community 47 - "use-legal.ts"
Cohesion: 0.22
Nodes (16): docsKey(), settingsKey, useLegalDocuments(), useLegalMutations(), AppSettingItem, AppSettingType, LegalDocument, LegalDocumentStatus (+8 more)

### Community 48 - "useCursorList"
Cohesion: 0.20
Nodes (12): useCommentList(), UseCommentListArgs, CommentStatus, useWordList(), useWordSearch(), UseWordSearchArgs, listWordsRequest(), CursorMeta (+4 more)

### Community 49 - "user.ts"
Cohesion: 0.20
Nodes (10): AuthSessionResult, CONSOLE_ACCESS_DENIED_MESSAGE, CONSOLE_ALLOWED_ROLES, ConsoleAllowedRole, LoginCredentials, ROLES, User, loginRequest() (+2 more)

### Community 50 - "contribution-entity-view.tsx"
Cohesion: 0.24
Nodes (16): ContributionEntityView(), DialectLabel, ENTITY_STATUS_TAG_COLOR, ExampleDetail(), MeaningDetail(), PairGrid(), PronunciationDetail(), ReadPane() (+8 more)

### Community 51 - "region-api.ts"
Cohesion: 0.24
Nodes (14): useDeleteRegion(), Region, RegionStatus, RegionType, createRegionRequest(), deleteRegionRequest(), listAllRegionsRequest(), listRegionsRequest() (+6 more)

### Community 52 - "verifier-application.ts"
Cohesion: 0.17
Nodes (13): useVerifierApplicationDetail(), useVerifierApplicationList(), ListVerifierApplicationsParams, SOCIAL_PLATFORM_LABELS, VERIFIER_APPLICATION_STATUSES, VerifierApplicationDetail, VerifierApplicationListItem, VerifierApplicationSocialLink (+5 more)

### Community 53 - "word-comma-splits-panel.tsx"
Cohesion: 0.24
Nodes (15): useApplyCommaSplit(), useCommaSplits(), useMarkCommaLiteral(), applyCommaSplitRequest(), CommaSplitTranslationDto, LemmaSplitMeaningOverride, listCommaSplitsRequest(), markCommaLiteralRequest() (+7 more)

### Community 54 - "word-images-field.tsx"
Cohesion: 0.21
Nodes (14): WordImageFormValue, listShareBackgrounds(), ListShareBackgroundsResult, ShareBackgroundItem, STOCK_PHOTO_PROVIDERS, STOCK_PROVIDER_LABELS, StockPhotoProvider, MediaExplorerModal() (+6 more)

### Community 55 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, prettier (+8 more)

### Community 56 - "contribution-mappers.ts"
Cohesion: 0.37
Nodes (15): AnyRecord, asString(), CHILD_FIELD_KEYS, fieldKeysFor(), normalizeChildEntity(), normalizeContributionDetail(), normalizeContributionMeta(), normalizeExample() (+7 more)

### Community 57 - "use-api-clients.ts"
Cohesion: 0.24
Nodes (13): listKey, useApiClientMutations(), useApiClients(), ALL_SCOPES, ApiClient, ApiClientChannel, ApiClientScope, ApiClientStatus (+5 more)

### Community 58 - "place-drawer.tsx"
Cohesion: 0.21
Nodes (13): useAllPlaceCategories(), uploadPlaceImage(), draftsFromPlace(), PlaceDrawer(), slugify(), STEPS, ACCEPTED, PlaceImagesField() (+5 more)

### Community 59 - "session.ts"
Cohesion: 0.21
Nodes (9): useLogout(), logoutRequest(), derivePrimaryRole(), EMPTY_SESSION, listeners, ROLE_RANK, SessionState, sessionStore (+1 more)

### Community 60 - "bug-report.ts"
Cohesion: 0.20
Nodes (11): useBugReportList(), useResolveBugReport(), BUG_REPORT_STATUS_LABELS, BUG_REPORT_STATUS_TAG_COLOR, BUG_REPORT_STATUSES, BugReportImage, BugReportListItem, BugReportStatus (+3 more)

### Community 61 - "import-sheet.tsx"
Cohesion: 0.20
Nodes (14): ACTION_WIDTH, ColId, colWidth(), DEFAULT_TEXT_WIDTH, fitTextarea(), ImportSheet(), isTextCol(), loadTextWidths() (+6 more)

### Community 62 - "ColdHostGate"
Cohesion: 0.18
Nodes (5): abortError(), AbortLike, COLD_HOST_MAX_IN_FLIGHT, ColdHostGate, Waiter

### Community 63 - "system-email-page.tsx"
Cohesion: 0.34
Nodes (10): useEmailLogs(), useEmailQuotas(), EmailLog, EmailLogStatus, EmailQuota, listEmailLogsRequest(), listEmailQuotasRequest(), CATEGORY_LABELS (+2 more)

### Community 64 - "compressImageForUpload"
Cohesion: 0.26
Nodes (9): uploadCampaignImage(), uploadVerifierScreenshot(), useUploadWordImage(), UploadedImage, uploadWordImage(), compressImageForUpload(), PHOTO_UPLOAD_MAX_HEIGHT, PHOTO_UPLOAD_MAX_WIDTH (+1 more)

### Community 65 - "audio-trim-editor.tsx"
Cohesion: 0.30
Nodes (11): audioBufferToWavBlob(), decodeAudioBlob(), detectSpeechBounds(), extractWaveformPeaks(), sliceAudioBuffer(), SpeechBounds, trimAudioBlob(), TrimAudioResult (+3 more)

### Community 66 - "web-analytics/presentation/components/trend-chart.tsx"
Cohesion: 0.17
Nodes (11): @ant-design/plots, ChartRow, dayLabel(), PlayTrendChartProps, PlayTrendSeries, formatRangeLabel(), formatYmd(), ChartRow (+3 more)

### Community 67 - "use-category-crud.ts"
Cohesion: 0.26
Nodes (11): CategoryInput, createCategoryRequest(), deleteCategoryRequest(), listCategoriesRequest(), updateCategoryRequest(), useCategoryList(), useCreateCategory(), useDeleteCategory() (+3 more)

### Community 68 - "top-pending-contributions-panel.tsx"
Cohesion: 0.24
Nodes (10): useContributionList(), UseContributionListArgs, useTopPendingContributions(), ContributionStatus, ENTITY_TYPE_LABELS, EntityType, listContributionsRequest(), titleFor() (+2 more)

### Community 69 - "database-backup-api.ts"
Cohesion: 0.26
Nodes (10): listKey, useTriggerDatabaseBackup(), BackupLogListResult, DatabaseBackupLog, DatabaseBackupLogStatus, TriggerBackupResult, listDatabaseBackupLogsRequest(), mapLog() (+2 more)

### Community 70 - "supabase-health-api.ts"
Cohesion: 0.23
Nodes (10): listKey, useTriggerSupabasePing(), SupabaseHealthCheck, SupabaseHealthCheckListResult, SupabaseHealthEnv, listSupabaseHealthChecksRequest(), mapHealthCheck(), SupabasePingResult (+2 more)

### Community 71 - "use-vote-counts.ts"
Cohesion: 0.33
Nodes (9): isVoteCountsReader(), toVoteCountMap(), useVoteCounts(), VoteCountsMap, buildTargetsQuery(), MAX_VOTE_TARGETS, VoteCountsItem, getVoteCountsRequest() (+1 more)

### Community 72 - "word-report-detail-page.tsx"
Cohesion: 0.33
Nodes (10): useDismissWordReport(), useInvalidateReports(), useMarkWordReportCorrected(), useTakedownFromReport(), useWordReport(), noteRequired(), dismissWordReportRequest(), markWordReportCorrectedRequest() (+2 more)

### Community 73 - "use-public-profile.ts"
Cohesion: 0.29
Nodes (10): getPublicActivityRequest(), getPublicProfileRequest(), usePublicActivity(), usePublicProfile(), normalizePublicActivity(), normalizePublicProfile(), PublicActivityItem, PublicActivityWire (+2 more)

### Community 74 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, @ant-design/icons, @ant-design/plots, antd, axios, dayjs, maplibre-gl, react (+4 more)

### Community 75 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, build:staging, dev, format, lint, lint:fix, preview (+4 more)

### Community 76 - "SambasKu Admin"
Cohesion: 0.17
Nodes (11): Aset media, Deploy Production, Deploy Staging, Fitur utama, Kenapa custom domain wajib, Routing SPA, SambasKu Admin, Scripts (+3 more)

### Community 77 - "try-restore-session.ts"
Cohesion: 0.31
Nodes (10): consoleLayoutRoute, loginRoute, rootRoute, revokeUnauthorizedConsoleSession(), ensureConsoleRoleAllowed(), tryRestoreSession(), useLogin(), isConsoleAllowedRole() (+2 more)

### Community 78 - "use-word-of-day.ts"
Cohesion: 0.31
Nodes (8): firstSense(), normalize(), useWordOfDay(), WordOfDay, getWordOfDayRequest(), WordOfDayWire, WordOfDayCard(), formatDate()

### Community 79 - "words-page.tsx"
Cohesion: 0.31
Nodes (9): useDuplicateWordGroups(), GroupCard(), statusColor(), WordDuplicatesPanel(), columnHelper, LIST_TABS, WordsPage(), WordsTab (+1 more)

### Community 80 - "ApiError"
Cohesion: 0.24
Nodes (7): cachedUser, contributorUser, performRefresh(), refreshTokenRequest(), ApiError, ApiFieldError, restoreSessionUser()

### Community 81 - "word.ts"
Cohesion: 0.24
Nodes (8): useRestoreWord(), useTakedownWord(), ListWordsParams, REGISTER_LABELS, WARNING_LABELS, WORD_STATUS_LABELS, restoreWordRequest(), takedownWordRequest()

### Community 82 - "vote-moderation-page.tsx"
Cohesion: 0.39
Nodes (8): DeleteVoteAction(), ResetTargetAction(), TargetPreviewCell(), topColumnHelper, TopTargetsTab(), voteColumnHelper, VoteListTab(), VoteModerationPage()

### Community 83 - "word-groups-page.tsx"
Cohesion: 0.39
Nodes (8): useAddWordGroupMember(), useAllWordGroups(), useCreateWordGroup(), usePickWords(), useUpdateWordGroup(), MembersDrawer(), STATUS_COLORS, WordGroupsPage()

### Community 84 - "WordClassOption"
Cohesion: 0.33
Nodes (7): DefaultLanguageIds, matchWordClassId(), WordClassOption, InlineWordEditorProps, MeaningFieldsProps, RelatedWordItemProps, classes

### Community 85 - "import-attribution-fields.tsx"
Cohesion: 0.25
Nodes (8): listWordImportSessionsRequest(), WordImportSupportType, EMPTY_IMPORT_SUPPORT, HistoryOption, ImportAttributionFields(), ImportSupportDraft, SUPPORT_TYPE_OPTIONS, UserOption

### Community 86 - "@tanstack/react-query"
Cohesion: 0.32
Nodes (5): react-dom, @tanstack/react-query, queryClient, router, setOnAuthExpired()

### Community 87 - "system-database-page.tsx"
Cohesion: 0.68
Nodes (7): useDatabaseBackupLogs(), isBackupActive(), BackupStatusBadge(), formatBytes(), formatDuration(), LatestBackupStatus(), SystemDatabasePage()

### Community 88 - "system-supabase-page.tsx"
Cohesion: 0.36
Nodes (7): useSupabaseHealthChecks(), ENV_TAG_COLOR, EnvFilter, formatDuration(), LAST_7D_CUTOFF, StatusBadge(), SystemSupabasePage()

### Community 89 - "use-review-verifier-application.ts"
Cohesion: 0.32
Nodes (7): ReviewVerifierApplicationResult, useReviewVerifierApplication(), VerifierApplicationDecision, ApproveVerifierApplicationResult, RejectVerifierApplicationResult, approveVerifierApplicationRequest(), rejectVerifierApplicationRequest()

### Community 90 - "lemma-definition-api.ts"
Cohesion: 0.43
Nodes (5): useLookupLemmaDefinition(), LemmaDefinitionEntry, LemmaDefinitionLookupResult, LemmaDefinitionSense, lookupLemmaDefinitionRequest()

### Community 91 - "safe-audio-player.tsx"
Cohesion: 0.43
Nodes (5): SafeAudioPlayerProps, SafeAudioPlayerSession(), LEGACY_JSDELIVR_HOSTS, publicAudioUrlCandidates(), resolvePublicAudioUrl()

### Community 93 - "jwt.test.ts"
Cohesion: 0.38
Nodes (4): RFC-4648, base64UrlDecode(), decodeJwtClaims(), JwtClaims

### Community 94 - "vite.config.ts"
Cohesion: 0.33
Nodes (4): vite, @vitejs/plugin-react, consoleRoot, repoRoot

### Community 95 - "image-censor-editor.tsx"
Cohesion: 0.43
Nodes (6): BrushCursorOverlay(), CensorBrushMode, ImageCensorEditor(), ImageCensorEditorProps, isTypingTarget(), loadSourceCanvas()

### Community 96 - "use-blocklist-mutations.ts"
Cohesion: 0.60
Nodes (4): useBulkCreateBlocklistWords(), useDeleteBlocklistWord(), bulkCreateBlocklistRequest(), deleteBlocklistRequest()

### Community 97 - "use-word-publish.ts"
Cohesion: 0.60
Nodes (4): usePublishWord(), useUnpublishWord(), publishWordRequest(), unpublishWordRequest()

### Community 98 - "use-change-password.ts"
Cohesion: 0.67
Nodes (3): useChangePassword(), ChangePasswordInput, changePasswordRequest()

## Knowledge Gaps
- **491 isolated node(s):** `name`, `version`, `description`, `type`, `private` (+486 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 533 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `antd` connect `antd` to `notifications-page.tsx`, `dashboard-page.tsx`, `client.ts`, `word-form-blocks.tsx`, `router.tsx`, `PageHeader`, `use-campaigns.ts`, `create-word-page.tsx`, `word-suggestion-detail-page.tsx`, `abuse-page.tsx`, `search-miss-api.ts`, `normalizeError`, `places-page.tsx`, `search-tab.tsx`, `web-analytics.ts`, `play-analytics-page.tsx`, `contribution-review-panel.tsx`, `user-admin-api.ts`, `import-words-drawer.tsx`, `audit-logs-page.tsx`, `audio-capture-ui.tsx`, `system-whatsapp-page.tsx`, `react`, `word-comments.tsx`, `package.json`, `announcement-api.ts`, `review-submit-queue.ts`, `word-reports-page.tsx`, `map-picker.tsx`, `place-categories-page.tsx`, `web-analytics-page.tsx`, `console-layout.tsx`, `comment-blocklist-page.tsx`, `user.ts`, `contribution-entity-view.tsx`, `word-comma-splits-panel.tsx`, `word-images-field.tsx`, `place-drawer.tsx`, `import-sheet.tsx`, `system-email-page.tsx`, `audio-trim-editor.tsx`, `web-analytics/presentation/components/trend-chart.tsx`, `top-pending-contributions-panel.tsx`, `use-vote-counts.ts`, `word-report-detail-page.tsx`, `use-word-of-day.ts`, `words-page.tsx`, `vote-moderation-page.tsx`, `word-groups-page.tsx`, `import-attribution-fields.tsx`, `@tanstack/react-query`, `system-database-page.tsx`, `system-supabase-page.tsx`, `safe-audio-player.tsx`, `image-censor-editor.tsx`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `notifications-page.tsx`, `dashboard-page.tsx`, `client.ts`, `word-form-blocks.tsx`, `PageHeader`, `use-campaigns.ts`, `create-word-page.tsx`, `word-suggestion-detail-page.tsx`, `abuse-page.tsx`, `search-miss-api.ts`, `normalizeError`, `places-page.tsx`, `antd`, `web-analytics.ts`, `play-analytics-page.tsx`, `contribution-review-panel.tsx`, `user-admin-api.ts`, `import-words-drawer.tsx`, `audit-logs-page.tsx`, `audio-capture-ui.tsx`, `system-whatsapp-page.tsx`, `package.json`, `announcement-api.ts`, `review-submit-queue.ts`, `word-reports-page.tsx`, `map-picker.tsx`, `place-categories-page.tsx`, `web-analytics-page.tsx`, `console-layout.tsx`, `comment-blocklist-page.tsx`, `useCursorList`, `contribution-entity-view.tsx`, `word-comma-splits-panel.tsx`, `word-images-field.tsx`, `place-drawer.tsx`, `import-sheet.tsx`, `system-email-page.tsx`, `compressImageForUpload`, `audio-trim-editor.tsx`, `web-analytics/presentation/components/trend-chart.tsx`, `word-report-detail-page.tsx`, `words-page.tsx`, `vote-moderation-page.tsx`, `word-groups-page.tsx`, `import-attribution-fields.tsx`, `@tanstack/react-query`, `system-database-page.tsx`, `system-supabase-page.tsx`, `safe-audio-player.tsx`, `image-censor-editor.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `@tanstack/react-query` connect `@tanstack/react-query` to `notifications-page.tsx`, `dashboard-page.tsx`, `create-word.ts`, `word-form-blocks.tsx`, `use-campaigns.ts`, `create-word-page.tsx`, `word-suggestion-detail-page.tsx`, `abuse-page.tsx`, `search-miss-api.ts`, `places-page.tsx`, `search-tab.tsx`, `antd`, `play-analytics-page.tsx`, `types.ts`, `contribution-review-panel.tsx`, `user-admin-api.ts`, `vote-admin-api.ts`, `import-words-drawer.tsx`, `audio-capture-ui.tsx`, `discussion-api.ts`, `system-whatsapp-page.tsx`, `use-word-groups.ts`, `vitest`, `word-api.ts`, `react`, `word-comments.tsx`, `package.json`, `announcement-api.ts`, `review-submit-queue.ts`, `play-analytics.ts`, `word-reports-page.tsx`, `place-categories-page.tsx`, `web-analytics-page.tsx`, `use-legal.ts`, `useCursorList`, `user.ts`, `region-api.ts`, `verifier-application.ts`, `word-comma-splits-panel.tsx`, `use-api-clients.ts`, `session.ts`, `bug-report.ts`, `system-email-page.tsx`, `use-category-crud.ts`, `top-pending-contributions-panel.tsx`, `database-backup-api.ts`, `supabase-health-api.ts`, `use-vote-counts.ts`, `word-report-detail-page.tsx`, `use-public-profile.ts`, `use-word-of-day.ts`, `word.ts`, `use-review-verifier-application.ts`, `lemma-definition-api.ts`, `use-blocklist-mutations.ts`, `use-word-publish.ts`, `use-change-password.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _491 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `notifications-page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0653417645287564 - nodes in this community are weakly interconnected._
- **Should `dashboard-page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05962732919254658 - nodes in this community are weakly interconnected._
- **Should `client.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06649616368286446 - nodes in this community are weakly interconnected._