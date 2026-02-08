
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genereert een PDF van een specifiek HTML element.
 * @param elementId Het ID van het element dat moet worden omgezet naar PDF.
 * @param fileName De gewenste bestandsnaam (zonder extensie).
 */
export const downloadAsPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element met id ${elementId} niet gevonden.`);
    return;
  }

  try {
    // Gebruik html2canvas om een screenshot van het element te maken
    // We gebruiken een hogere scale voor betere printkwaliteit
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true, // Belangrijk voor afbeeldingen van externe bronnen zoals Unsplash
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Bereken afmetingen voor A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Voeg de afbeelding toe aan de PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Download het bestand
    pdf.save(`${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF generatie fout:', error);
    return false;
  }
};
