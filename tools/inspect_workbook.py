"""Dump the structure of the Welfare Officer Return workbook.

Use it when the sheet layout changes (new rows/sections) to see exactly what the
backend parser will encounter. Prints every non-empty cell per sheet, and flags
section titles so row shifts between months are easy to spot.

    pip install openpyxl
    python tools/inspect_workbook.py backend/test/fixtures/officer-return-2026-27.xlsx [Sep]
"""

import re
import sys

from openpyxl import load_workbook

SECTION = re.compile(r"^[A-Z]\.\s+\S")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path, only = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else None)
    wb = load_workbook(path, data_only=True)  # cached formula results, like the backend

    if not only:
        print("Sheets and section rows (compare across months to spot inserted rows):")
        for ws in wb.worksheets:
            sections = [
                f"{c.value.split('.')[0]}@{c.row}"
                for c in ws["A"]
                if isinstance(c.value, str) and SECTION.match(c.value.strip())
            ]
            print(f"  {ws.title:<16} rows={ws.max_row:<4} {' '.join(sections)}")
        return

    ws = wb[only]
    for row in ws.iter_rows():
        cells = [(c.coordinate, c.value) for c in row if c.value is not None]
        if cells:
            marker = ">>" if isinstance(row[0].value, str) and SECTION.match(row[0].value.strip()) else "  "
            print(marker, cells)


if __name__ == "__main__":
    main()
