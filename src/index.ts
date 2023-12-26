import {
  Widgets,
  box,
  button,
  checkbox,
  form,
  radiobutton,
  radioset,
  screen,
  text
} from "blessed";
import { Install, getInstallList } from "./detect";
import {doInstall} from "./install";

/**
 * --------
 * functions for detection and installation
 * --------
 */

/**
 * --------
 *  end functions for detection and installation
 * --------
 */

/**
 * --------
 *  tui setup
 * --------
 */
var tui = screen({
  smartCSR: true
});
tui.title = "Midnight Installer";

const hasMouse = process.platform in ["linux"] || tui.terminal in [];

tui.append(
  text({
    top: "0",
    left: "0",
    content: hasMouse
      ? "Press Q, Ctrl-C or click the 'X' to exit"
      : "Press Q or Ctrl-C to exit",
    style: {
      fg: "white"
    },
    clickable: false,
    input: false
  })
);

if (hasMouse) {
  var exitButton = box({
    top: "2",
    right: "2",
    width: "shrink",
    height: "shrink",
    content: "X",
    tags: true,
    style: {
      fg: "white",
      bg: "red"
    },
    border: {
      type: "bg"
    },
    clickable: true,
    input: false
  });

  exitButton.on("click", function (mouse) {
    return process.exit(0);
  });

  tui.append(exitButton);
}

var background = form({
  top: "center",
  left: "center",
  width: "90%",
  height: "90%",
  content: "Placeholder",
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
  keys: true,
  vi: true,
  clickable: hasMouse,
  input: true
});

tui.append(background);

const installList = getInstallList();

const formLayout: Widgets.BlessedElement[][] = [];

let selectedNode: {
  x: number;
  y: number;
} = {
  x: 0,
  y: 0
};

let selectedBranch: "stable" | "ptb" | "canary" | "" = "";

function getBranchColor(branch: "stable" | "ptb" | "canary") {
  switch (branch) {
    case "stable":
      return "#5865f2";
    case "ptb":
      return "#3c45a5";
    case "canary":
      return "#faa71d";
  }
}

if (installList.length) {
  const str =
    "Available branches: " +
    installList.map((install) => install.branch).join(",");
  let txt = text({
    content: str,
    tags: true,
    style: {
      fg: "white",
      bg: "black"
    },
    left: "0",
    top: "0",
    shrink: true,
    input: false
  });
  background.append(txt);

  var set = radioset({
    left: "0",
    top: "72",
    width: "shrink",
    height: "shrink",
    style: {
      fg: "white",
      bg: "black"
    }
  });
  background.append(set);
  let offset = 14;
  let btns = [];
  let idx = 0;
  for (const install of installList) {
    let ind = idx;
    idx++;
    var btn = radiobutton({
      text: install.branch,
      checked: false,
      style: {
        fg: getBranchColor(install.branch),
        bg: "#000000"
      },
      top: "0",
      left: `${offset}`,
      width: `${install.branch.length + 4 * 48}`,
      height: "256",
      shrink: true
    });
    offset += (install.branch.length + 4) * 30;
    btn.on("check", () => {
      selectedBranch = install.branch;
      let content = `Features already installed: ${
        install.features?.length ? install.features.join(",") : "none"
      }`;
      txt.setContent(content);
      background.render();
    });
    btn.on("focus", () => {
      selectedNode.x = ind;
      selectedNode.y = 0;
    });
    set.append(btn);
    btns.push(btn);
    if (!formLayout[0]) {
      formLayout[0] = [];
    }
    formLayout[0].push(btn);
  }
  var asarBox = checkbox({
    text: "Install OpenAsar",
    checked: false,
    input: true,
    hidden: false,
    left: "0",
    top: "140",
    style: {
      fg: "gray",
      bg: "red"
    },
    shrink: true
  });
  formLayout[1] = [asarBox];

  background.append(asarBox);

  var moonlightBox = checkbox({
    text: "Install Moonlight",
    checked: false,
    input: true,
    hidden: false,
    left: "0",
    top: "180",
    style: {
      fg: "gray",
      bg: "red"
    },
    shrink: true
  });

  formLayout[2] = [moonlightBox];

  background.append(moonlightBox);

  var submitButton = button({
    content: "Run Installation",
    input: true,
    hidden: false,
    left: "0",
    top: "260",
    style: {
      fg: "black",
      bg: "blue"
    },
    shrink: true
  });

  submitButton.on("press", () => {
    background.submit();
  });

  formLayout[3] = [submitButton];

  background.append(submitButton);

  background.on("prerender", () => {
    // txt.setContent(`Selected branch: ${selectedBranch}, ${selectedNode.x}, ${selectedNode.y}`);
    let branch = installList.find(
      (install) => install.branch === selectedBranch
    );
    if (branch) {
      asarBox.enableInput();
      asarBox.style.fg = "white";
      asarBox.style.bg = "black";
      moonlightBox.enableInput();
      moonlightBox.style.fg = "white";
      moonlightBox.style.bg = "black";
      if (branch.features?.includes("OpenAsar")) {
        asarBox.check();
        asarBox.style.fg = "black";
        asarBox.style.bg = "green";
      }
      if (branch.features?.includes("moonlight")) {
        moonlightBox.check();
        moonlightBox.style.fg = "black";
        moonlightBox.style.bg = "green";
      }
      if (branch.features?.includes("hh3")) {
        moonlightBox.uncheck();
        moonlightBox.style.fg = "gray";
        moonlightBox.style.bg = "red";
      }
    } else {
      asarBox.uncheck();
      moonlightBox.uncheck();
    }
  });
} else {
  background.setContent("No Discord installations found :(");
}

/**
 * --------
 * end tui setup
 * --------
 */

/**
 * --------
 *  render and events
 * --------
 */

// key binds and clicks
tui.key(["q", "C-c"], function (ch, key) {
  return process.exit(0);
});

tui.key(["up", "down", "left", "right"], (ch, key) => {
  switch (key.name) {
    case "up":
      if (selectedNode.y > 0) {
        selectedNode.y--;
        if (selectedNode.x >= formLayout[selectedNode.y].length) {
          selectedNode.x = formLayout[selectedNode.y].length - 1;
        }
        formLayout[selectedNode.y][selectedNode.x].focus();
      }
      return false;
    case "down":
      if (selectedNode.y < formLayout.length - 1) {
        selectedNode.y++;
        if (selectedNode.x >= formLayout[selectedNode.y].length) {
          selectedNode.x = formLayout[selectedNode.y].length - 1;
        }
        formLayout[selectedNode.y][selectedNode.x].focus();
      }
      return false;
    case "left":
      if (selectedNode.x > 0) {
        selectedNode.x--;
        formLayout[selectedNode.y][selectedNode.x].focus();
      }
      return false;
    case "right":
      if (selectedNode.x < formLayout[selectedNode.y].length - 1) {
        selectedNode.x++;
        formLayout[selectedNode.y][selectedNode.x].focus();
      }
      return false;
  }
  return true;
});

if (hasMouse) {
  //
}

formLayout[selectedNode.y][selectedNode.x].focus();

export type ResultValue = {
  branch: string;
  install: Install;
  features: string[];
}

type Result = {
  'radio-button': boolean[];
  checkbox: boolean[];
}

background.on("submit", (values: Result) => {
  let install = installList.find((install) => install.branch === selectedBranch);
  if (!install) return;
  let result: ResultValue = {
    branch: selectedBranch,
    install,
    features: []
  };
  values?.checkbox?.[0] && !install.features?.includes("OpenAsar") && result.features.push("OpenAsar");
  values?.checkbox?.[1] && !(install.features?.includes("moonlight") || install.features?.includes("hh3")) && result.features.push("moonlight");
  doInstall(result, tui);
});

// render the screen
tui.render();
