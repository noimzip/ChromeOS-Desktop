document.getElementById('appicon-chrome').onclick = () => {
  console.log('???');
  openURL('chrome://newtab');
}

document.getElementById('appicon-files').onclick = () => {
  console.log('???');
  openURL('chrome://file-manager');
}

document.getElementById('appicon-settings').onclick = () => {
  console.log('???');
  openURL('chrome://os-settings');
}

document.getElementById('appicon-x').onclick = () => {
  console.log('???');
  window.open('https://x.com');
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

  document.querySelectorAll(".appicon,.widget").forEach(item => {
    item.onpointermove = function(event){
      if(event.buttons){
          this.style.left     = this.offsetLeft + event.movementX + 'px'
          this.style.top      = this.offsetTop  + event.movementY + 'px'
          this.style.position = 'absolute'
          this.draggable      = false
        this.setPointerCapture(event.pointerId)
    }
  }
});
}

document.getElementById('close_change_widget_position_modal').onclick = () => {
  change_widget_position_modal_overlay.style.display = 'none';
}

document.getElementById('save_change_widget_position').onclick = () => {
  

}

document.getElementById('appicon-add').onclick = () => {
  add_newapp_modal_overlay.style.display = 'block';
}

document.getElementById('close_add_newapp_modal').onclick = () => {
  add_newapp_modal_overlay.style.display = 'none';
}

developer_user_agent.textContent = window.navigator.userAgent.toLowerCase()

document.getElementById('refresh_page').onclick = () => {
  location.reload();
}