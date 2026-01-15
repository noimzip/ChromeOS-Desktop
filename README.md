# [WIP] Soul Widgets Manager
## A project bringing Windows-like desktop experience to ChromeOS

### Note: This project is still developing, it might not be stable enough

## If you want to try it out...
- Clone the repository to the Linux VM:
```shell
git clone https://github.com/noimzip/Soul-Widgets-Manager.git
```

- Using the installer and startup file:
```shell
cd Soul-Widgets-Manager
sh installer.sh
sh startup.sh
```

- Create a new virtual desktop, drag the overlay window into it
- Sideload the integration extension (located in `/chrome_extension`) (see [here](https://github.com/supechicken/ChromeOS-LivePaper#installation) for a detailed instructions)
- Switch to the virtual desktop created previously and try it out

## How it works?
- A transparent overlay created using Electron, with shortcuts and widgets on top
- Communicate with the integration extension in order to launch built-in apps (like `Files` and `Settings`)
- WIP...
