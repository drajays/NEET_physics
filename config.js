// Multi-device setup — edit these values for your personal deployment.
window.APP_CONFIG = {
  // Permanent shared bank (Pearson Vol I + Vol II). Hosted on GitHub.
  remoteBankUrl: 'https://raw.githubusercontent.com/drajays/NEET_pingal/main/bank.json',

  // Change this PIN. Only you use it to unlock Import / Add / Edit on your admin device.
  adminPin: 'change-me-1234',

  // Student devices: auto-download the remote bank on open when local bank is empty or older.
  autoSyncOnLoad: true,

  appName: 'NEET MCQ Practice'
};
