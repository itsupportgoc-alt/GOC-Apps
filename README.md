# GOC Builders - Windows apps

Download and install the app you need. The apps **update themselves** when a new version is published here.

| App | Download |
|---|---|
| **GOC Builders** (home page with all 4 systems) | [GOC-Builders-Setup.exe](https://github.com/itsupportgoc-alt/GOC-Apps/releases/latest/download/GOC-Builders-Setup.exe) |
| Project Hub | [GOC-Projects-Setup.exe](https://github.com/itsupportgoc-alt/GOC-Apps/releases/latest/download/GOC-Projects-Setup.exe) |
| Payroll & Manpower | [GOC-Payroll-Setup.exe](https://github.com/itsupportgoc-alt/GOC-Apps/releases/latest/download/GOC-Payroll-Setup.exe) |
| Materials Monitoring | [GOC-Materials-Setup.exe](https://github.com/itsupportgoc-alt/GOC-Apps/releases/latest/download/GOC-Materials-Setup.exe) |
| Project Concerns | [GOC-Concerns-Setup.exe](https://github.com/itsupportgoc-alt/GOC-Apps/releases/latest/download/GOC-Concerns-Setup.exe) |

All versions: [Releases](https://github.com/itsupportgoc-alt/GOC-Apps/releases)

## How to install

1. Click the download link of the app you need.
2. Open the downloaded `.exe` and follow the installer.
3. If Windows shows **"Windows protected your PC"**, click **More info → Run anyway**.

## Updates

- **Changes to the system** (pages, features, data) show immediately: the apps open the online website.
- **Changes to the app itself** are published here. Installed apps check for a new version when they start and every 4 hours, download it in the background, and install it when the app is closed. You can also use **Help → Check for updates**.

## For the developer

This repository only contains the app wrapper (no system code, no passwords). Every push to `main` builds a new version (`v1.1.<build number>`) with GitHub Actions.

## What's new

- **2026-11-13** - Payroll & Manpower: new 13th Month Pay and Non-Returning Workers pages; Retention column in Pakyawan.
- **2026-11-13** - Payroll & Manpower: import the weekly payroll Excel file (JOY file) as it is, all site sheets at once.
- **2026-11-13** - Project Hub: one Import / Export button; Full backup and Restore backup removed.
- **2026-11-13** - Payroll & Manpower: sort A-Z / Z-A and sortable columns in Years of service, 13th Month Pay and Non-Returning Workers.
- **2026-11-13** - 13th Month Pay and Non-Returning Workers: Designation and Date hired columns beside Site.
- **2026-11-13** - Pakyawan: add and edit additions and cash advance lines.
- **2026-11-13** - Pakyawan list: Update button (was Open).
- **2026-11-13** - Payroll Summary: Other column renamed to Food Allowance.
- **2026-11-13** - All systems: Print and Export to Excel by month or year.
- **2026-11-14** - Payroll Summary: month / year fix.
- **2026-11-14** - Years of service: filter by years of service.
- **2026-11-14** - Payroll Summary: Allowance column; CA / Vale combined.
- **2026-11-14** - Payroll Summary: Vale removed.
- **2026-11-14** - Designation and Years of service filters (Years of service, 13th Month Pay, Non-Returning).
- **2026-11-14** - Payroll cards (workers, payroll, net pay, pakyawan balance) only on the Charts tab.
- **2026-11-14** - Food allowance card on the Payroll Charts tab.
