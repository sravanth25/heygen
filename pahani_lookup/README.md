# Pahani assisted capture

A small helper for looking up **a single pahani (land record)** on the Telangana
CCLA land-status portal (<https://ccla.telangana.gov.in/landStatus.done>) and
saving it cleanly as PDF + HTML + screenshot.

## What it is — and isn't

This is an **assisted** tool for looking up land **you have a stake in**. It
opens a real browser and *you* drive the lookup: pick the district / mandal /
village, enter the survey or khata number, and **solve the CAPTCHA yourself**.
The only thing the tool does is save the resulting record neatly.

It intentionally does **not**:

- solve, feed, or bypass the CAPTCHA;
- enumerate survey numbers or bulk-download an entire village;
- run unattended.

The CAPTCHA on the portal is there on purpose — one human lookup at a time.
Bulk-harvesting other people's land records without a lawful basis (ownership,
an official role, or a licensed/authorized purpose) can breach the portal's
terms and India's data-protection rules (IT Act / SPDI, DPDP Act). If you need
village-wide data for a legitimate purpose, request it from the district
revenue office / MRO, the CCLA/Dharani administration, or via RTI.

## Requirements

- Python 3.9+
- A machine that can actually reach the portal (some Telangana gov endpoints are
  only reachable from certain networks/regions).

## Setup

```bash
pip install -r requirements.txt
playwright install chromium   # first run only
```

## Use

```bash
python fetch_pahani.py --label "myfield-sy123"
```

1. A browser window opens at the land-status page.
2. Select district / mandal / village, enter your survey/khata number.
3. Solve the CAPTCHA and submit.
4. Switch back to the terminal, press **Enter** — the record is saved to
   `./output/` as `<timestamp>_<label>.pdf` (plus `.html` and `.png`).
5. Choose whether to look up another record or quit.

## Output

Files land in `pahani_lookup/output/`, named by timestamp and your `--label`.
