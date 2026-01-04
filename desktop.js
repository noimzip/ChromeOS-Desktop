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
  escmenu_modal_overlay.style.display = 'none';
  settingsmenu_modal_overlay.style.display = 'block';
}

document.getElementById('close_settingsmenu_modal').onclick = () => {
  settingsmenu_modal_overlay.style.display = 'none';
}

document.getElementById('open_change_widget_position_modal').onclick = () => {
  escmenu_modal_overlay.style.display = 'none';
  change_widget_position_modal_overlay.style.display = 'block';

  document.getElementById('entry-chrome').onpointermove = function(event){
    if(event.buttons){
        this.style.left     = this.offsetLeft + event.movementX + 'px'
        this.style.top      = this.offsetTop  + event.movementY + 'px'
        this.style.position = 'absolute'
        this.draggable      = false
        this.setPointerCapture(event.pointerId)
    }
  }
}