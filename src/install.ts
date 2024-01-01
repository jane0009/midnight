import { Widgets, box } from "blessed";
import { ResultValue } from ".";
import { exec } from "child_process";
import fs from "fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { userInfo } from "os";
import stream from "stream";
import util from "util";

const injectorText = `const fs = require("fs");
const isogit = require("isomorphic-git");
const http = require("isomorphic-git/http/node");

(async () => {
  // update moonlight
  if (fs.existsSync("##MOONLIGHT##")) {
    await isogit.fastForward({
      fs,
      http,
      dir: "##MOONLIGHT##",
    });

    require("##MOONLIGHT##/dist/injector.js").inject(
      require("path").resolve(__dirname, "../_app.asar")
    );
  }
})();
`;

const packageJson = `{
  "name": "discord",
  "main": "./injector.js",
  "private": true,
  "dependencies": {
    "isomorphic-git": "^1.25.2"
  }
}`;

const moonlightGit = "https://github.com/moonlight-mod/moonlight";
const openAsarUrl =
  "https://github.com/GooseMod/OpenAsar/releases/download/nightly/app.asar";

let logStr = "";

export async function doInstall(data: ResultValue, tui: Widgets.Screen) {
  var background = box({
    top: "center",
    left: "center",
    width: "90%",
    height: "90%",
    content: "",
    tags: true,
    border: {
      type: "line"
    },
    style: {
      fg: "white",
      bg: "black",
      border: {
        fg: "#f0f0f0"
      }
    },
    input: false
  });
  for (let child of tui.children) {
    tui.remove(child);
  }
  tui.append(background);

  if (!data.features.length) {
    appendText("No features set to install, exiting.", background, tui);
    doExit(background, tui);
  } else {
    appendText(`Installing ${data.features.join(", ")}...`, background, tui);

    let user = userInfo();
    let installPath =
      data.install.platform === "win32"
        ? user.homedir + "/AppData/Roaming/moonlight"
        : user.homedir + "/.moonlight";

    if (data.features.includes("moonlight")) {
      appendText(`Cloning Moonlight to ${installPath}`, background, tui);
      try {
        await git.clone({
          fs,
          http,
          dir: installPath,
          url: moonlightGit
        });
      } catch (e) {
        appendText(`Failed to clone Moonlight: ${e}`, background, tui);
        doExit(background, tui);
        return;
      }
      appendText(
        "Attempting to install packages using pnpm...",
        background,
        tui
      );
      exec(
        "pnpm i -r",
        {
          cwd: installPath
        },
        async (err, stdout, stderr) => {
          if (stderr) {
            appendText(`npm stderr: ${stderr}`, background, tui);
          }
          if (stdout) {
            appendText(`npm stdout: ${stdout}`, background, tui);
          }

          if (err) {
            appendText(`Failed to install packages: ${err}`, background, tui);
            doExit(background, tui);
            return;
          } else {
            setTimeout(async () => {
              await doMidnightBuild(data, installPath, background, tui);
              await nextStep(data, installPath, background, tui);
            }, 500);
          }
        }
      );
    } else {
      await nextStep(data, installPath, background, tui);
    }
  }
}

const doMidnightBuild = async (
  data: ResultValue,
  moonlightInstallPath: string,
  background: Widgets.BlessedElement,
  tui: Widgets.Screen
) => {
  return new Promise((resolve, reject) => {
    exec(
      "pnpm build",
      {
        cwd: moonlightInstallPath
      },
      (err, stdout, stderr) => {
        if (stderr) {
          appendText(`npm stderr: ${stderr}`, background, tui);
        }
        if (stdout) {
          appendText(`npm stdout: ${stdout}`, background, tui);
        }

        if (err) {
          appendText(`Failed to build Moonlight: ${err}`, background, tui);
          doExit(background, tui);
          reject(err);
        } else {
          appendText("Moonlight was successfully built.", background, tui);
          resolve(undefined);
        }
      }
    );
  });
};

const nextStep = async (
  data: ResultValue,
  moonlightInstallPath: string,
  background: Widgets.BlessedElement,
  tui: Widgets.Screen
) => {
  const discordFolder = data.install.resources_folder_path;
  if (data.features.includes("OpenAsar")) {
    appendText("Backing up current app.asar", background, tui);
    if (fs.existsSync(discordFolder + "/_app.asar")) {
      fs.renameSync(
        discordFolder + "/_app.asar",
        discordFolder + "/app.asar.backup"
      );
    } else {
      fs.renameSync(
        discordFolder + "/app.asar",
        discordFolder + "/app.asar.backup"
      );
    }
    appendText("Downloading latest OpenAsar nightly...", background, tui);

    const streamPipeline = util.promisify(stream.pipeline);
    const res = await fetch(openAsarUrl);
    if (!res || !res.body || res.body === null) {
      appendText("Failed to download OpenAsar", background, tui);
      doExit(background, tui);
      return;
    } else {
      const dest = fs.createWriteStream(discordFolder + "/app.asar");
      await streamPipeline([res.body], dest);
      appendText("OpenAsar file written.", background, tui);
    }
  }

  if (data.features.includes("moonlight")) {
    appendText("Setting up injector...", background, tui);
    let injector = injectorText.replace(
      /##MOONLIGHT##/g,
      moonlightInstallPath.replace(/\\/g, "/")
    );
    if (fs.existsSync(discordFolder + "/app.asar")) {
      fs.renameSync(discordFolder + "/app.asar", discordFolder + "/_app.asar");
    }
    fs.mkdirSync(discordFolder + "/app");
    fs.writeFileSync(discordFolder + "/app/injector.js", injector, {
      flag: "w+"
    });
    fs.writeFileSync(discordFolder + "/app/package.json", packageJson, {
      flag: "w+"
    });

    appendText("Installing injector packages...", background, tui);
    exec(
      "pnpm i",
      {
        cwd: discordFolder + "/app"
      },
      async (err, stdout, stderr) => {
        if (stderr) {
          appendText(`npm stderr: ${stderr}`, background, tui);
        }
        if (stdout) {
          appendText(`npm stdout: ${stdout}`, background, tui);
        }

        if (err) {
          appendText(`Failed to install packages: ${err}`, background, tui);
          doExit(background, tui);
          return;
        } else {
          appendText("Moonlight was successfully installed.", background, tui);
          doExit(background, tui);
          return;
        }
      }
    );
  }
};

const doExit = (background: Widgets.BlessedElement, tui: Widgets.Screen) => {
  appendText("Exiting...", background, tui);
  // clean up
  setTimeout(() => {
    tui.program.clear();
    tui.program.disableMouse();
    tui.program.showCursor();
    tui.program.normalBuffer();
    setTimeout(() => {
      console.log("INSTALL LOG OUTPUT:");
      console.log(logStr);
      process.exit(0);
    }, 100);
  }, 5000);
};

const appendText = (
  text: string,
  background: Widgets.BlessedElement,
  tui: Widgets.Screen
) => {
  logStr += text + "\n";
  background.setContent(background.content + text + "\n");
  tui.render();
};
