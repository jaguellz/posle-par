// Provider snippets belong in an audited adapter after real accounts are created.
// Empty IDs and enabled:false never trigger external requests.
window.AFTER_CLASS_ANALYTICS = Object.freeze({
  liveinternet: { enabled: false, siteId: '' },
  sberAds: { enabled: false, counterId: '' },
  myTracker: { enabled: false, counterId: '' }
});
