import * as vscode from 'vscode';
import { resolveCliPathFromVSCodeExecutablePath } from 'vscode-test';
import Axios, { AxiosResponse } from "axios";
import { Script } from 'node:vm';
import { AsyncLocalStorage } from 'node:async_hooks';
import {Memento} from 'vscode';
export function activate(context: vscode.ExtensionContext) {
  vscode.window.registerTreeDataProvider('cricketCode',new TreeDataProvider);
 
  context.subscriptions.push(
    
    vscode.commands.registerCommand('cricketCode.getmatches', async () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        'cricketCode', // Identifies the type of the webview. Used internally
        'Cricket Code', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
			enableScripts: true}
      );
      const updateMatchesWebview=async ()=>{
        panel.webview.html = await getMatchesWebviewContent();
        };
    
        updateMatchesWebview();

        const interval=setInterval(updateMatchesWebview,3000);

        panel.onDidDispose(
          () => {
            // When the panel is closed, cancel any future updates to the webview content
            clearInterval(interval);
          },
          null,
          context.subscriptions
        );
    
    })
    ,vscode.commands.registerCommand('cricketCode.getcommentary', async (id:string) => {
    ;
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        'cricketCode', // Identifies the type of the webview. Used internally
        'Cricket Code', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
			enableScripts: true}
      );
    const updateCommentaryWebview=async ()=>{
	  panel.webview.html = await getCommentaryWebviewContent(id);
    };

    updateCommentaryWebview();

    const interval=setInterval(updateCommentaryWebview,6000);

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
async function getMatches() :Promise<any>
{

  const URL="https://cric-api.herokuapp.com/matches";

  return   Axios.get(URL)
  .then(
      (response: AxiosResponse<any>)=>{
        
        return  response.data;
      
      }
  )
  .catch((err)=>console.log(err));

}

function makeRow(team:any):string{

  var row='<tr>'+'<td>'+team.team+': ';
  team.score.map((sc: any,idx:number)=>{
    if(idx!==0)
    {
      row+=' & ';
    }
    if(sc.runs!==undefined)
    {
      var overs=sc.over!==undefined?'('+sc.overs+')':'';
      row+=sc.runs+'/'+sc.wickets+overs;      
    }
  });
  row+='</td>'+'</tr>';

  return row;

}

function makeTable(matches:any[]) :string
{
  
  var table: string;
  table="<table>";
  matches.map((match)=>{
    var batsmenRow=makeRow(match.batting);
    table+=batsmenRow;

    var bowlerRow=makeRow(match.bowling);
    table+=bowlerRow;

    table+='<tr><td></td><tr>';
    
  });
  table+='</table>';
  return table;
}

async function getMatchesWebviewContent() {

  var matches;
  var table:string;

  matches=getMatches();

  table=makeTable(await matches);

  var HTML=`<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta http-equiv="Content-Security-Policy">
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cricket Code</title>
  </head>
  <body>
  
  `+table+`
  </body>
  </html>`;
  
	return HTML;
}


async function getCommentaryWebviewContent (id:string) {
  id="35212"
  var commentary;
  var ctable:string;
  commentary=getcommentary(id)
  
 
  ctable=makeComTable(await commentary);
       
 
  var HTML=`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cricket Code</title>
  </head>
  <body>

  `+ctable+`
  </body>
  </html>`;
    
  return HTML;
    }
    async function getcommentary(id:string) :Promise<any>
    {
     
    const URL="https://cric-api.herokuapp.com/commentary/"+id;
    
      return   Axios.get(URL)
      .then(
          (response: AxiosResponse<any>)=>{
           
            return  response.data;
           
          
          }
      )
      .catch((err)=>console.log(err));
    
  }

    function makeComRow(comm:any):string{

      var crow='<tr>'+'<td>'+comm.comm+': ';
      comm.comm.map((sc: any,idx:number)=>{
        if(idx!==0)
        {
          crow+=' & ';
        }
        if(sc.comm!==undefined)
        {
          var covers=sc.over!==undefined?'('+sc.overs+')':'';
          crow+=covers;      
        }
      });
      crow+='</td>'+'</tr>';
    
      return crow;
    
    }
    
    function makeComTable(commentary:any[]) :string
    { 
      
     
      var ctable: string;
      ctable="<table>";
      console.log("kkkkkkkkkkkkkkk")
      var newcom=[];

      newcom=commentary.comm;
      console.log(newcom)
      newcom.map((com: any[])=>{
        var crow=`<tr><td>${com.comm}</td></tr>`
        ctable+=crow
      });
    console.log(ctable)
    return ctable
    }

    class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
      onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;
    
      data: TreeItem[];
    
      constructor() {
        this.data = [];
      }
    
      getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
        return element;
      }
    
      getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
        if (element === undefined) {
          return this.data;
        }
        return element.children;
      }
    }
    
    class TreeItem extends vscode.TreeItem {
      children: TreeItem[]|undefined;
    
      constructor(label: string, children?: TreeItem[]) {
        super(
            label,
            children === undefined ? vscode.TreeItemCollapsibleState.None :
                                     vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
      }
    }