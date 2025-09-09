document.getElementById('entry-chrome').onclick = () => {
  console.log('???');
  openURL('chrome://newtab');
}

document.getElementById('entry-files').onclick = () => {
  console.log('???');
  openURL('chrome://file-manager');
}

document.getElementById('entry-settings').onclick = () => {
  console.log('???');
  openURL('chrome://os-settings');
}

document.getElementById('entry-github').onclick = () => {
  console.log('???');
  window.open('https://github.com/');
}

document.getElementById('entry-youtube').onclick = () => {
  console.log('???');
  window.open('https://www.youtube.com/');
}

document.getElementById('entry-x').onclick = () => {
  console.log('???');
  window.open('https://x.com/');
}
