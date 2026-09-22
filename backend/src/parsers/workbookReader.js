import ExcelJS from 'exceljs';
import JSZip from 'jszip';

/**
 * Adapter over the xlsx library: turns a workbook buffer into plain
 * `{ name, rows }` grids of resolved cell values (formula results, not formulas).
 * Everything downstream works on these grids, so the xlsx library can be swapped here alone.
 *
 * rows[r][c] is 0-based; rows[0] is spreadsheet row 1.
 */
const IGNORED_NODES = [
  'drawing',
  'legacyDrawing',
  'picture',
  'tableParts',
  'dataValidations',
  'conditionalFormatting',
  'hyperlinks',
  'extLst',
];

export async function readWorkbook(buffer) {
  const workbook = await loadWorkbook(buffer);

  return workbook.worksheets.map((ws) => {
    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Merged "slave" cells repeat the master's value in ExcelJS; keep only the master.
        cells[colNumber - 1] = cell.type === ExcelJS.ValueType.Merge ? null : resolveValue(cell.value);
      });
      rows[rowNumber - 1] = cells;
    });
    for (let i = 0; i < rows.length; i++) rows[i] ??= [];
    return { name: ws.name.trim(), rows };
  });
}

/**
 * Only cell values matter. exceljs can crash on drawing parts it can't parse
 * ("reading 'anchors'"), e.g. after some editors re-save the file, so on failure
 * retry once with every drawing part stripped from the package.
 */
async function loadWorkbook(buffer) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer, { ignoreNodes: IGNORED_NODES });
    return workbook;
  } catch (error) {
    const zip = await JSZip.loadAsync(buffer);
    const drawingParts = Object.keys(zip.files).filter((name) => name.startsWith('xl/drawings/'));
    if (!drawingParts.length) throw error;
    drawingParts.forEach((name) => zip.remove(name));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await zip.generateAsync({ type: 'nodebuffer' }), { ignoreNodes: IGNORED_NODES });
    return workbook;
  }
}

function resolveValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;
  if ('result' in value) return resolveValue(value.result); // formula / shared formula
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  if ('text' in value) return value.text; // hyperlink
  if ('error' in value) return null; // #REF!, #DIV/0!, ...
  return null;
}
