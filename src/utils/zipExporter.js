import JSZip from 'jszip';

export async function downloadProjectZip(files, projectName = 'backendflow-project') {
  const zip = new JSZip();

  files.forEach(file => {
    zip.file(file.name, file.code);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
