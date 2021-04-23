import * as vscode from "vscode";
import Axios, { AxiosResponse } from "axios";
import { window } from "vscode";
import { strict } from "node:assert";

var notifications:string[]=[];

export function activate(context: vscode.ExtensionContext) {
  vscode.window.registerTreeDataProvider("cricketCode", new TreeDataProvider());
  context.subscriptions.push(
    vscode.commands.registerCommand("cricketCode.getmatches", async () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        "cricketCode", // Identifies the type of the webview. Used internally
        "Cricket Code", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        { enableScripts: true }
      );
      const updateMatchesWebview = async () => {
        panel.webview.html = await getMatchesWebviewContent();
      };
      panel.webview.html = fetching();
      const interval = setInterval(updateMatchesWebview, 3000);
      panel.onDidDispose(
        () => {
          // When the panel is closed, cancel any future updates to the webview content
          clearInterval(interval);
        },
        null,
        context.subscriptions
      );
    }),
    vscode.commands.registerCommand(
      "cricketCode.getcommentary",
      async (matches: any[]) => {
        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel(
          "cricketCode", // Identifies the type of the webview. Used internally
          "Matches", // Title of the panel displayed to the user
          vscode.ViewColumn.One, // Editor column to show the new webview panel in.
          { enableScripts: true }
        );
        const updateCommentaryWebview = async () => {
          panel.webview.html = await getCommentaryWebviewContent();
        };
        updateCommentaryWebview();
        const interval = setInterval(updateCommentaryWebview, 10000);
        panel.webview.onDidReceiveMessage(
          async (message) => {
            const newPanel = vscode.window.createWebviewPanel(
              "cricketCode", // Identifies the type of the webview. Used internally
              "Commentary", // Title of the panel displayed to the user
              vscode.ViewColumn.One, // Editor column to show the new webview panel in.
              {
                enableScripts: true,
              }
            );
            var id = message.command;
            newPanel.webview.html = await getMatchCommentaryWebview(
              message.command
            );
            const updateMatchCommentaryWebview = async () => {
              newPanel.webview.html = await getMatchCommentaryWebview(id);
            };
            updateMatchCommentaryWebview();
            const interval = setInterval(updateMatchCommentaryWebview, 3000);
            newPanel.onDidDispose(
              () => {
                // When the panel is closed, cancel any future updates to the webview content
                clearInterval(interval);
              },
              null,
              context.subscriptions
            );
          },
          undefined,
          context.subscriptions
        );

        panel.onDidDispose(
          () => {
            // When the panel is closed, cancel any future updates to the webview content
            clearInterval(interval);
          },
          null,
          context.subscriptions
        );
      }
    ),
    vscode.commands.registerCommand("cricketCode.viewScorecard", async () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        "cricketCode", // Identifies the type of the webview. Used internally
        "Select Match", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        { enableScripts: true }
      );
      const updateScorecardWebview = async () => {
        panel.webview.html = fetching();
        panel.webview.html = await getScorecardWebviewContent();
        // panel.webview.html = await getInningsWebviewContent();
      };
      updateScorecardWebview();
      const interval = setInterval(updateScorecardWebview, 10000);

      ///innigs
      panel.webview.onDidReceiveMessage(
        async (message) => {
          const newPanel = vscode.window.createWebviewPanel(
            "cricketCode", // Identifies the type of the webview. Used internally
            "Select Innings", // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
              enableScripts: true,
            }
          );
          var id = message.command;
          newPanel.webview.html = await getInningsWebviewContent();
          const updateInningsWebview = async () => {
            newPanel.webview.html = await getInningsWebviewContent();
          };
          updateInningsWebview();
          const interval = setInterval(updateInningsWebview, 3000);

          //scorecard

          newPanel.webview.onDidReceiveMessage(
            async (message) => {
              const scorePanel = vscode.window.createWebviewPanel(
                "cricketCode", // Identifies the type of the webview. Used internally
                "Scorecard", // Title of the panel displayed to the user
                vscode.ViewColumn.One, // Editor column to show the new webview panel in.
                {
                  enableScripts: true,
                }
              );

              var inn = message.inn;
              scorePanel.webview.html = await getMatchScorecardWebview(id, inn);
              const updateMatchScorecardWebview = async () => {
                scorePanel.webview.html = await getMatchScorecardWebview(
                  id,
                  inn
                );
              };
              updateMatchScorecardWebview();
              const interval = setInterval(updateMatchScorecardWebview, 3000);

              scorePanel.onDidDispose(
                () => {
                  // When the panel is closed, cancel any future updates to the webview content
                  clearInterval(interval);
                },
                null,
                context.subscriptions
              );
            },
            undefined,
            context.subscriptions
          );

          newPanel.onDidDispose(
            () => {
              // When the panel is closed, cancel any future updates to the webview content
              clearInterval(interval);
            },
            null,
            context.subscriptions
          );
        },
        undefined,
        context.subscriptions
      );

      panel.onDidDispose(
        () => {
          // When the panel is closed, cancel any future updates to the webview content
          clearInterval(interval);
        },
        null,
        context.subscriptions
      );
    })
  );
}
async function getMatches(): Promise<any> {
  const URL = "https://cric-api.herokuapp.com/matches";

  return Axios.get(URL)
    .then((response: AxiosResponse<any>) => {
      return response.data;
    })
    .catch((err) => console.log(err));
}

function makeRow(team: any): string {
  var row = "<tr>" + "<td>" + team.team + ": ";
  team.score.map((sc: any, idx: number) => {
    if (idx !== 0) {
      row += " & ";
    }
    if (sc.runs !== undefined) {
      var overs = sc.over !== undefined ? "(" + sc.overs + ")" : "";
      row += sc.runs + "/" + sc.wickets + overs;
    }
  });
  row += "</td>" + "</tr>";

  return row;
}

function makeTable(matches: any[]): string {
  var table: string;
  table = "<table>";
  var batar: any[] = [];
  var idar: any[] = [];
  var bowlar: any[] = [];

  matches.map((git: any) => {
    batar.push(git.batting.team);
    idar.push(git.id);
    bowlar.push(git.bowling.team);
  });
  matches.map(async (match, index) => {
    var batsmenRow = makeRow(match.batting);

    table += batsmenRow;

    var bowlerRow = makeRow(match.bowling);
    table += bowlerRow;

    table += "<tr><td>" + match.status + "</td></tr>";
    table += `<tr><td></td><tr>`;
  });
  table += "</table>";

  return table;
}

async function getMatchesWebviewContent() {
  var matches;
  var table: string;
  matches = getMatches();

  table = makeTable(await matches);

  var HTML =
    `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cricket Code</title>
  </head>
  <body>
  <div id="table">
  ` +
    table +
    `
  </div>
  <script>
    function showCom(){
      var btn=document.getElementById("btn");
      btn.innerHTML="Click on Get Commentary";
    }
  </script>
  </body>
  
  </html>`;

  return HTML;
}

function fetching() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta http-equiv="Content-Security-Policy">
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cricket Code</title>
  </head>
  <body>
  <div id="table">
  Fetching....
  </div>
  <script>
    function showCom(){
      var btn=document.getElementById("btn");
      btn.innerHTML="Click on Get Commentary";
    }
  </script>
  </body>
  
  </html>`;
}

function getIndex(matches: any[]) {
  var idar: any[] = [];
  matches.map((gid) => {
    idar.push(gid.id);
  });
  return idar;
}

function getBat(matches: any[]) {
  var teamar: any[] = [];
  matches.map((gid) => {
    teamar.push(gid.batting.team);
  });
  return teamar;
}
function getBowl(matches: any[]) {
  var teamar: any[] = [];
  matches.map((gid) => {
    teamar.push(gid.bowling.team);
  });
  return teamar;
}

async function getCommentaryWebviewContent() {
  var matches;
  var idar: any[] = [];

  var batar;
  var bowlar;

  var buttons: string | "" = "";
  matches = getMatches();
  batar = getBat(await matches);
  bowlar = getBowl(await matches);
  idar = getIndex(await matches);

  for (let i = 0; i < idar.length; i++) {
    buttons +=
      `<button class=` +
      batar[i] +
      "/" +
      bowlar[i] +
      ` id="` +
      idar[i] +
      `" onclick="whichCom(` +
      idar[i] +
      `)">` +
      batar[i] +
      "/" +
      bowlar[i] +
      `</button>`;
  }
  var HTML =
    `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta http-equiv="Content-Security-Policy">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cricket Code</title>
  </head>
  <body>
  ` +
    buttons +
    `

  <script>

  function whichCom(id){
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      command: id,
      text: 'get commentary'
    })
  }
  </script>
  </body>
  </html>`;

  return HTML;
}

async function getcommentary(id: string): Promise<any> {
  const URL = "https://cric-api.herokuapp.com/commentary/" + id;

  return Axios.get(URL)
    .then((response: AxiosResponse<any>) => {
      return response.data;
    })
    .catch((err) => console.log(err));
}

async function getMatchCommentaryWebview(id: string) {
  var commentary = await getcommentary(id);
  var table = makeComTable(commentary);
  table += "</table>";
  return (
    `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta http-equiv="Content-Security-Policy">
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cricket Code</title>
  </head>
  <body>
  <div id="table">
  ` +
    table +
    `
  </div>
  <script>
    function showCom(){
      var btn=document.getElementById("btn");
      btn.innerHTML="Click on Get Commentary";
    }
  </script>
  </body>
  
  </html>`
  );
}

function makeComTable(commentary: any): string {
  var ctable: string;
  ctable = "<table>";
  var newcom = [];
  newcom = commentary.comm;

  newcom.map((com: any) => {
    var crow = `<tr><td>`;
    if (com.over !== null) {
      crow += com.over + `: `;
    }
    var commentaryLine:string=com.comm;
    if(commentaryLine.search("SIX")!==-1||commentaryLine.search("THATS OUT")!==-1)
    {
      commentaryLine=commentaryLine.replace('<b>','');
      commentaryLine=commentaryLine.replace('</b>','');
      if(notifications.indexOf(commentaryLine)===-1)
      {
        notifications.push(commentaryLine);
        window.showInformationMessage(commentaryLine);
      }
    }
    crow += com.comm + `</td></tr>`;
    ctable += crow;
  });

  return ctable;
}

async function getScorecardWebviewContent() {
  var matches;
  var idar: any[] = [];
  var batar;
  var bowlar;

  var buttons: string | "" = "";
  matches = getMatches();
  batar = getBat(await matches);
  bowlar = getBowl(await matches);
  idar = getIndex(await matches);

  for (let i = 0; i < idar.length; i++) {
    buttons +=
      `<button class=` +
      batar[i] +
      "/" +
      bowlar[i] +
      ` id="` +
      idar[i] +
      `" onclick="whichCom(` +
      idar[i] +
      `)">` +
      batar[i] +
      "/" +
      bowlar[i] +
      `</button>`;
  }
  var HTML =
    `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta http-equiv="Content-Security-Policy">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cricket Code</title>
  </head>
  <body>
  ` +
    buttons +
    `
  <script>

  function whichCom(id){
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      command: id,
      text: 'view scorecard'
    })
  }
  </script>
  </body>
  </html>`;

  return HTML;
}
async function getInningsWebviewContent() {
  var idar: any[] = [];
  var buttons: string | "" = "";

  for (let i = 1; i < 5; i++) {
    buttons +=
      `<button class='Innings ` +
      i +
      `'  id="` +
      idar[i] +
      `" onclick="whichInn(` +
      i +
      `)">Innings ` +
      i +
      `</button>`;
  }
  var HTML =
    `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta http-equiv="Content-Security-Policy">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cricket Code</title>
  </head>
  <body>
  ` +
    buttons +
    `
  <script>

  function whichInn(inn){
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
    inn: inn,
      text: 'view scorecard'
    })
  }
  </script>
  </body>
  </html>`;

  return HTML;
}

async function getMatchScorecardWebview(id: string, inn: any) {
  var scorecard = await getScorecard(id);
  var scoretable = makeScoreTable(scorecard, inn);

  return (
    `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta http-equiv="Content-Security-Policy">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cricket Code</title>
    </head>
    <style>td{padding-right:50px;} table{margin-bottom:20px;}</style>
    <body>
    <div id="table">
    ` +
    scoretable +
    `
    </div>
    <script>
    </script>
    </body>

    </html>`
  );
}

async function getScorecard(id: string): Promise<any> {
  const URL = "https://cric-api.herokuapp.com/scorecard/" + id;

  return Axios.get(URL)
    .then((response: AxiosResponse<any>) => {
      return response.data;
    })
    .catch((err) => console.log(err));
}

function makeScoreTable(scorecard: any, inn: any): string {
  try {
    inn = inn - 1;
    var sctable: string;
    sctable = "<table>";
    var newscore: any[] = [];
    var ballscore: any[] = [];
    var fallscore: any[] = [];
    newscore = scorecard[inn].batcard;
    ballscore = scorecard[inn].bowlcard;
    fallscore = scorecard[inn].fall_wickets;
    sctable += `<u><b>Batting Card</b></u>`;
    var brow = `<tr><td>Name</td><td>Overs</td><td>Maidens</td><td>Runs</td><td>Wickets</td></tr>`;
    var srow = `<tr><td>Name</td><td>Runs</td><td>Balls</td><td>Fours</td><td>Sixes</td><td>Strike Rate</td><td>Dismissal</td></tr>`;
    var frow = `<tr><td>Wicket Number</td><td>Score</td><td>Overs</td><td>Name</td></tr>`;
    sctable += srow;
    newscore.map((sc: any) => {
      var srow = `<tr>`;
      srow += `<td>` + sc.name + `</td>`;
      srow += `<td>` + sc.runs + `</td>`;
      srow += `<td>` + sc.balls + `</td>`;
      srow += `<td>` + sc.fours + `</td>`;
      srow += `<td>` + sc.six + `</td>`;
      srow += `<td>` + sc.sr + `</td>`;
      srow += `<td>` + sc.dismissal + `</td></tr>`;
      sctable += srow;
    });
    sctable += `</table>`;
    sctable += `<hr>`;
    sctable += `<u><b>Bowling Card</b></u>`;
    sctable += "<table>";
    sctable += brow;
    ballscore.map((bc: any) => {
      var brow = `<tr>`;
      brow += `<td>` + bc.name + `</td>`;
      brow += `<td>` + bc.overs + `</td>`;
      brow += `<td>` + bc.maidens + `</td>`;
      brow += `<td>` + bc.runs + `</td>`;
      brow += `<td>` + bc.wickets + `</td>`;
      sctable += brow;
    });
    sctable += `</table>`;
    sctable += `<hr>`;
    sctable += `<u><b>Fall of Wickets</b></u>`;
    sctable += "<table>";
    sctable += frow;
    fallscore.map((fc: any) => {
      var frow = `<tr>`;
      frow += `<td>` + fc.wkt_num + `</td>`;
      frow += `<td>` + fc.score + `</td>`;
      frow += `<td>` + fc.overs + `</td>`;
      frow += `<td>` + fc.name + `</td>`;
      sctable += frow;
    });
    sctable += `</table>`;
    return sctable;
  } catch {
    return "Innings has not yet started";
  }
}

class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem | null | undefined> | undefined;

  data: TreeItem[];

  constructor() {
    this.data = [];
  }

  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: TreeItem | undefined
  ): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;

  constructor(label: string, children?: TreeItem[]) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.children = children;
  }
}
