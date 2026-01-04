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

document.addEventListener('keydown', function(e) {
  if(e.key === 'Escape'){
    escmenu_modal_overlay.style.display = 'block';
  }
});

document.getElementById('close_menu_modal').onclick = () => {
  escmenu_modal_overlay.style.display = 'none';
}

document.getElementById('open_settingsmenu_modal').onclick = () => {
  settingsmenu_modal_overlay.style.display = 'block';
}

document.getElementById('close_settingsmenu_modal').onclick = () => {
  settingsmenu_modal_overlay.style.display = 'none';
}