// CMS configuration switch
// provider: 'json' (default, uses local JSON files) or 'sanity'
window.CMS_CONFIG = {
  provider: 'json',
  sanity: {
    projectId: '', // e.g., 'abcd1234'
    dataset: 'production',
    apiVersion: '2023-10-01',
    useCdn: true
  }
};

