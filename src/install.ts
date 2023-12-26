import { Widgets, box } from "blessed";
import { ResultValue } from ".";

const injectorText = `require(##MOONLIGHT##).inject(
  require("path").resolve(__dirname, "../_app.asar")
);`;
const moonlightGit = "https://github.com/moonlight-mod/moonlight";
const openAsarUrl =
  "https://github.com/GooseMod/OpenAsar/releases/download/nightly/app.asar";

let logStr = "";

export function doInstall(data: ResultValue, tui: Widgets.Screen) {
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
  } else {
    appendText(`Installing ${data.features.join(", ")}...`, background, tui);
  }

  appendText("Exiting in 10 seconds...", background, tui);

  appendText(JSON.stringify(data), background, tui);

  // clean up
  setTimeout(() => {
    tui.program.clear();
    tui.program.disableMouse();
    tui.program.showCursor();
    tui.program.normalBuffer();
    console.log(logStr);
    process.exit(0);
  }, 10000);
}

const appendText = (text: string, background: Widgets.BlessedElement, tui: Widgets.Screen) => {
  logStr += text + "\n";
  background.setContent(background.content + text + "\n");
  tui.render();
};
