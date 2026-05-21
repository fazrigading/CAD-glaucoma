export const getColorLabel = (label: string): { strokeColor: string; pointColor: string; fillColor: string } => {
  if (label === 'disc') {
    return { strokeColor: 'rgba(255, 10, 67, 1)', pointColor: 'rgba(255, 10, 67, 1)', fillColor: 'rgba(255, 10, 67, 0.5)' };
  } else {
    return { strokeColor: 'rgba(78, 184, 245, 1)', pointColor: 'rgba(78, 184, 245, 1)', fillColor: 'rgba(78, 184, 245, 0.5)' };
  }
}; 