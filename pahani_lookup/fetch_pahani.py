#!/usr/bin/env python3
"""
Assisted pahani (land record) capture helper for the Telangana CCLA land-status portal.

WHAT THIS DOES
--------------
Opens the official land-status page in a real browser window. YOU do the lookup
by hand -- pick district / mandal / village, enter the survey or khata number,
and solve the CAPTCHA yourself. Once the pahani is on screen, press Enter in the
terminal and this tool saves it cleanly as PDF + HTML + a screenshot, with a
timestamped filename, into ./output.

WHAT THIS DOES NOT DO
---------------------
- It does NOT solve, bypass, or automate the CAPTCHA.
- It does NOT enumerate survey numbers or bulk-harvest a village.
This is a convenience wrapper around a single manual lookup of land you have a
stake in -- nothing more.

USAGE
-----
    pip install -r requirements.txt
    playwright install chromium        # first run only
    python fetch_pahani.py --label "myfield-sy123"

Then follow the on-screen prompts.
"""

import argparse
import datetime as dt
import pathlib
import re
import sys

URL = "https://ccla.telangana.gov.in/landStatus.done"
OUTPUT_DIR = pathlib.Path(__file__).parent / "output"


def slugify(text: str) -> str:
    text = re.sub(r"[^A-Za-z0-9._-]+", "-", text.strip())
    return text.strip("-") or "pahani"


def save_pdf_via_cdp(page, path: pathlib.Path) -> bool:
    """page.pdf() only works headless; use the CDP printToPDF in headed mode."""
    import base64

    try:
        client = page.context.new_cdp_session(page)
        result = client.send(
            "Page.printToPDF",
            {"printBackground": True, "preferCSSPageSize": True},
        )
        path.write_bytes(base64.b64decode(result["data"]))
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  ! PDF capture failed ({exc}). HTML + screenshot were still saved.")
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--label",
        default="",
        help="Short label for the filename, e.g. the survey number you looked up.",
    )
    parser.add_argument(
        "--url",
        default=URL,
        help="Override the portal URL (defaults to the CCLA land-status page).",
    )
    args = parser.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "Playwright is not installed. Run:\n"
            "    pip install -r requirements.txt\n"
            "    playwright install chromium",
            file=sys.stderr,
        )
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print(" Pahani assisted capture")
    print("=" * 70)
    print(
        "A browser window will open at the land-status portal.\n"
        "  1. Select district / mandal / village and enter your survey/khata no.\n"
        "  2. Solve the CAPTCHA yourself and submit.\n"
        "  3. When the pahani/record is fully visible, come back here and press\n"
        "     Enter to save it. Type 'q' then Enter to quit without saving.\n"
    )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        try:
            page.goto(args.url, wait_until="domcontentloaded", timeout=60_000)
        except Exception as exc:  # noqa: BLE001
            print(f"Could not open {args.url}: {exc}", file=sys.stderr)
            print(
                "If this machine cannot reach the portal, run the tool somewhere "
                "that can (the site is only reachable from within India in some cases).",
                file=sys.stderr,
            )
            browser.close()
            return 1

        while True:
            answer = input("\nPress Enter to SAVE the current page (or 'q' to quit): ").strip().lower()
            if answer == "q":
                print("Quitting without saving.")
                break

            stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
            base = f"{stamp}_{slugify(args.label)}" if args.label else stamp
            pdf_path = OUTPUT_DIR / f"{base}.pdf"
            html_path = OUTPUT_DIR / f"{base}.html"
            png_path = OUTPUT_DIR / f"{base}.png"

            try:
                html_path.write_text(page.content(), encoding="utf-8")
                print(f"  ✓ HTML       -> {html_path}")
            except Exception as exc:  # noqa: BLE001
                print(f"  ! HTML capture failed: {exc}")

            try:
                page.screenshot(path=str(png_path), full_page=True)
                print(f"  ✓ Screenshot -> {png_path}")
            except Exception as exc:  # noqa: BLE001
                print(f"  ! Screenshot failed: {exc}")

            if save_pdf_via_cdp(page, pdf_path):
                print(f"  ✓ PDF        -> {pdf_path}")

            again = input("Saved. Look up another record? (y to continue, anything else to quit): ").strip().lower()
            if again != "y":
                break

        browser.close()

    print("\nDone. Files are in:", OUTPUT_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
