# midnight

hi! this is an experimental installer for [Moonlight](https://github.com/moonlight-mod/moonlight). 

it's console-based, with the aim of being pretty light-weight and also supporting some fancier things like automatically detecting instances, installing [OpenAsar](https://github.com/GooseMod/OpenAsar) and whatever other random stuff i decide to add in.

## PLEASE LOOK AT THIS:

this is ***NOT*** the [official moonlight installer](https://github.com/moonlight-mod/moonlight-installer). If you want something __tested__ that is going to work 99.99% of the time, use that. If you just want to mess around, feel free to check this out.

With that out of the way,

### Installation

just head right on over to the [releases](https://github.com/jane0009/midnight/releases/) page, and download the executable that works for your system.

##### NOTES:

on linux, you'll need ncurses-base and ncurses-term, or their equivalents for your distro.

macOS on apple silicon (arm64/aarch64) will probably not work, due to the mandatory code signing requirements. if that's the case, you may have to set up and run this app manually. i don't have a mac to test, and don't plan on getting one!

#### Manual installation

clone or download the repository. install the packages with your preferred node package manager (i use pnpm). execute the `start` script.

for example, on pnpm:
`pnpm i`
`pnpm start`

### Development and contributing

i plan to do most of the work myself, honestly. otherwise feel free to PR any improvements you can think up and use the issues page to report any bugs.