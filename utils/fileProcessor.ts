import { ProcessedFile } from '../types';
import { IGNORED_FOLDERS, ALLOWED_EXTENSIONS, IGNORED_FILENAMES } from '../constants';

export const shouldProcessFile = (filePath: string): boolean => {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];

  // Check ignored folders
  if (parts.some(part => IGNORED_FOLDERS.includes(part))) {
    return false;
  }

  // Check ignored filenames
  if (IGNORED_FILENAMES.includes(fileName)) {
    return false;
  }

  // Check extensions
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
  
  // Special case: Dockerfile, CNAME, etc. usually have no extension but might be text
  const isSpecialConfigFile = ['Dockerfile', 'CNAME', 'LICENSE', 'README'].includes(fileName);

  return hasValidExtension || isSpecialConfigFile;
};

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const generateXMLPrompt = (files: ProcessedFile[]): string => {
  let xmlOutput = `<changes>\n`;
  
  // Sort files by path for consistency
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  sortedFiles.forEach(file => {
    xmlOutput += `  <change>\n`;
    xmlOutput += `    <file>${file.path}</file>\n`;
    xmlOutput += `    <description>Context restoration</description>\n`;
    xmlOutput += `    <content><![CDATA[${file.content}]]></content>\n`;
    xmlOutput += `  </change>\n`;
  });

  xmlOutput += `</changes>`;
  
  return `Oto aktualny stan mojego projektu. Proszę przeanalizuj te pliki, abyśmy mogli kontynuować pracę nad grą.\n\n${xmlOutput}`;
};