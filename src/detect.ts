import { userInfo } from "os";
import fs from "fs";
import { exec } from "child_process";

const platform = process.platform;
const user = userInfo();

export type Install = {
  branch: "stable" | "ptb" | "canary";
  platform: "win32" | "darwin" | "linux";
  resources_folder_path: string;
  readonly?: boolean;
  features?: string[];
};

export const getInstallList = (): Install[] => {
  switch (platform) {
    // get the easy ones out of the way
    case "win32": {
      const installs: Install[] = [];
      if (fs.existsSync(`${user.homedir}\\AppData\\Local\\Discord`)) {
        const dirList = fs.readdirSync(
          `${user.homedir}\\AppData\\Local\\Discord`
        );
        const dir = dirList.find((d) => d.startsWith("app-"));
        if (dir) {
          installs.push({
            branch: "stable",
            platform: "win32",
            resources_folder_path: `${user.homedir}\\AppData\\Local\\Discord\\${dir}\\resources`
          });
        }
      }
      if (fs.existsSync(`${user.homedir}\\AppData\\Local\\DiscordPTB`)) {
        const dirList = fs.readdirSync(
          `${user.homedir}\\AppData\\Local\\DiscordPTB`
        );
        const dir = dirList.find((d) => d.startsWith("app-"));
        if (dir) {
          installs.push({
            branch: "ptb",
            platform: "win32",
            resources_folder_path: `${user.homedir}\\AppData\\Local\\DiscordPTB\\${dir}\\resources`
          });
        }
      }
      if (fs.existsSync(`${user.homedir}\\AppData\\Local\\DiscordCanary`)) {
        const dirList = fs.readdirSync(
          `${user.homedir}\\AppData\\Local\\DiscordCanary`
        );
        const dir = dirList.find((d) => d.startsWith("app-"));
        if (dir) {
          installs.push({
            branch: "canary",
            platform: "win32",
            resources_folder_path: `${user.homedir}\\AppData\\Local\\DiscordCanary\\${dir}\\resources`
          });
        }
      }
      for (const install of installs) {
        install.features = getFeatures(install);
      }
      return installs;
    }
    case "darwin": {
      const installs: Install[] = [];

      if (fs.existsSync("/Applications/Discord")) {
        installs.push({
          branch: "stable",
          platform: "darwin",
          resources_folder_path: "/Applications/Discord/Contents/Resources"
        });
      } else if (fs.existsSync("/Applications/Discord.app")) {
        installs.push({
          branch: "stable",
          platform: "darwin",
          resources_folder_path: "/Applications/Discord.app/Contents/Resources"
        });
      } else if (fs.existsSync(`${user.homedir}/Applications/Discord`)) {
        installs.push({
          branch: "stable",
          platform: "darwin",
          resources_folder_path: `${user.homedir}/Applications/Discord/Contents/Resources`
        });
      } else if (fs.existsSync(`${user.homedir}/Applications/Discord.app`)) {
        installs.push({
          branch: "stable",
          platform: "darwin",
          resources_folder_path: `${user.homedir}/Applications/Discord.app/Contents/Resources`
        });
      }

      if (fs.existsSync("/Applications/Discord PTB")) {
        installs.push({
          branch: "ptb",
          platform: "darwin",
          resources_folder_path: "/Applications/Discord PTB/Contents/Resources"
        });
      } else if (fs.existsSync("/Applications/Discord PTB.app")) {
        installs.push({
          branch: "ptb",
          platform: "darwin",
          resources_folder_path:
            "/Applications/Discord PTB.app/Contents/Resources"
        });
      } else if (fs.existsSync(`${user.homedir}/Applications/Discord PTB`)) {
        installs.push({
          branch: "ptb",
          platform: "darwin",
          resources_folder_path: `${user.homedir}/Applications/Discord PTB/Contents/Resources`
        });
      } else if (
        fs.existsSync(`${user.homedir}/Applications/Discord PTB.app`)
      ) {
        installs.push({
          branch: "ptb",
          platform: "darwin",
          resources_folder_path: `${user.homedir}/Applications/Discord PTB.app/Contents/Resources`
        });
      }

      if (fs.existsSync("/Applications/Discord Canary")) {
        installs.push({
          branch: "canary",
          platform: "darwin",
          resources_folder_path:
            "/Applications/Discord Canary/Contents/Resources"
        });
      } else if (fs.existsSync("/Applications/Discord Canary.app")) {
        installs.push({
          branch: "canary",
          platform: "darwin",
          resources_folder_path:
            "/Applications/Discord Canary.app/Contents/Resources"
        });
      } else if (fs.existsSync(`${user.homedir}/Applications/Discord Canary`)) {
        installs.push({
          branch: "canary",
          platform: "darwin",
          resources_folder_path: `${user.homedir}/Applications/Discord Canary/Contents/Resources`
        });
      } else if (
        fs.existsSync(`${user.homedir}/Applications/Discord Canary.app`)
      ) {
        installs.push({
          branch: "canary",
          platform: "darwin",
          resources_folder_path: `${user.homedir}/Applications/Discord Canary.app/Contents/Resources`
        });
      }
      for (const install of installs) {
        install.features = getFeatures(install);
      }
      return installs;
    }
    // who the hell knows where it is.
    case "linux": {
      const installs: Install[] = [];
      // check if it's in the path
      const stable = checkLinuxPath("stable");
      if (stable) installs.push(stable);
      const ptb = checkLinuxPath("ptb");
      if (ptb) installs.push(ptb);
      const canary = checkLinuxPath("canary");
      if (canary) installs.push(canary);
      for (const install of installs) {
        install.features = getFeatures(install);
      }
      return installs;
    }
    default:
      return [];
  }
};

const commandsToCheck = {
  stable: ["Discord", "discord"],
  ptb: ["DiscordPTB", "discordptb"],
  canary: ["DiscordCanary", "discordcanary"]
};

const checkLinuxPath = (
  branch: "stable" | "ptb" | "canary"
): Install | undefined => {
  const cmds = commandsToCheck[branch];
  var install = undefined;
  for (const cmd of cmds) {
    // use child_process to check if the command exists using `which`
    // TODO there is no guarantee this works, like, at all. find a better way
    exec(`bash -c "which ${cmd}"`, (err, stdout, stderr) => {
      if (err) return;
      if (stderr) return;
      if (stdout.startsWith("which: no")) return;
      install = {
        branch,
        platform: "linux",
        resources_folder_path: stdout.trim()
      } as Install;
    });
    if (install !== undefined) break;
  }
  return install;
};

const getFeatures = (install: Install): string[] => {
  const features: string[] = [];
  // OpenAsar
  if (fs.existsSync(`${install.resources_folder_path}/app.asar.backup`)) {
    features.push("OpenAsar");
  }

  // hh3 + moonlight
  if (fs.existsSync(`${install.resources_folder_path}/_app.asar`)) {
    if (fs.existsSync(`${install.resources_folder_path}/app`)) {
      // it is in fact hh3 or moonlight
      if (fs.existsSync(`${install.resources_folder_path}/app/injector.js`)) {
        features.push("moonlight");
      } else if (
        fs.existsSync(`${install.resources_folder_path}/app/app_bootstrap`)
      ) {
        features.push("hh3");
      }
    }
  }

  return features;
};
