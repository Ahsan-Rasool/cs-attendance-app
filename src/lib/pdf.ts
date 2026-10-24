import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
export { buildAttendanceHtml, buildTimetableHtml } from './pdfHtml.ts';

export async function sharePdf(html: string, fileName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' });
}
