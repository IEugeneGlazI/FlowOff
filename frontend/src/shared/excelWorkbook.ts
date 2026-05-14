type ExcelCell = string | number | null | undefined;

export type ExcelSheet = {
  name: string;
  columns: string[];
  rows: ExcelCell[][];
};

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getCellType(value: ExcelCell) {
  return typeof value === 'number' ? 'Number' : 'String';
}

function normalizeCell(value: ExcelCell) {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'number' ? String(value) : value;
}

export function downloadExcelWorkbook(fileName: string, sheets: ExcelSheet[]) {
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8F3EB" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${sheets
    .map(
      (sheet) => `<Worksheet ss:Name="${escapeXml(sheet.name)}">
    <Table>
      <Row>
        ${sheet.columns.map((column) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(column)}</Data></Cell>`).join('')}
      </Row>
      ${sheet.rows
        .map(
          (row) => `<Row>
        ${row
          .map((cell) => {
            const normalized = normalizeCell(cell);
            return `<Cell><Data ss:Type="${getCellType(cell)}">${escapeXml(normalized)}</Data></Cell>`;
          })
          .join('')}
      </Row>`,
        )
        .join('')}
    </Table>
  </Worksheet>`,
    )
    .join('')}
</Workbook>`;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
