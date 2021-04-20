import * as vscode from 'vscode';
import { resolveCliPathFromVSCodeExecutablePath } from 'vscode-test';
import Axios, { AxiosResponse } from "axios";
import { Script } from 'node:vm';
import { AsyncLocalStorage } from 'node:async_hooks';
import {Memento} from 'vscode';
import { insidersDownloadDirToExecutablePath } from 'vscode-test/out/util';
import { constants } from 'node:buffer';
import { parse } from 'node:path';
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
    ,vscode.commands.registerCommand('cricketCode.getcommentary', async (matches:any[]) => {
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
	  panel.webview.html = await getCommentaryWebviewContent();
    };

    updateCommentaryWebview();

    const interval=setInterval(updateCommentaryWebview,18000);

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

  return Axios.get(URL)
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
  var batar: any[]=[]
  var idar: any[]=[]
  var bowlar: any[]=[]
  var comar:any[]=[]
  var commentary;
  var ctable:string;

  matches.map((git:any[])=>{
    batar.push(git.batting.team)
    idar.push(git.id)
    bowlar.push(git.bowling.team)
  })
  matches.map(async (match,index)=>{
    var batsmenRow=makeRow(match.batting);

    table+=batsmenRow;

    var bowlerRow=makeRow(match.bowling);
    table+=bowlerRow;

    // commentary=getcommentary(idar[index])
    // ctable=makeComTable(await commentary);
   
    // comar.push(ctable);
    // table+=ctable;
    table+="<tr><td>"+match.status+"</td></tr>"
    table+=`<tr><td></td><tr>`
    // <button id="btn" onclick="showCom()"></button>
  });
  table+='</table>';

  return table;
}

async function getMatchesWebviewContent() {

  var matches;
  var table:string;
  var team_id:string;
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
  <div id="table">
  `+table+`
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

function getIndex(matches:any[]) {
  var idar:any[]=[]
  matches.map(gid=>{
    idar.push(gid.id)
  })
  return idar
}

function getBat(matches:any[]) {
  var teamar:any[]=[]
  matches.map(gid=>{
    teamar.push(gid.batting.team)
  })
  return teamar
}
function getBowl(matches:any[]) {
  var teamar:any[]=[]
  matches.map(gid=>{
    teamar.push(gid.bowling.team)
  })
  return teamar
}

async function getCommentaryWebviewContent () {
 
  var matches;
  var idar: any[]=[]
  // var allComs=[]
  var commentary;
  var bigdiv="<div>";
  var batar;
  var bowlar;
  var ctable:string|undefined=undefined;
  var buttons:string|""=""
  matches=getMatches()
  batar=getBat(await matches)
  bowlar=getBowl(await matches)
  idar=getIndex(await matches)
  
  
   for(let i=0;i<idar.length;i++){
    buttons+=`<button class=`+batar[i]+'/'+bowlar[i]+` id="btn${i}" onclick="whichCom(${i})">`+batar[i]+'/'+bowlar[i]+`</button>`
    commentary=getcommentary(idar[i])
    ctable=makeComTable(await commentary,i.toString()); 
    ctable+='</table>'
    bigdiv+=ctable
  }
  bigdiv+="</div>"
  var HTML=`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cricket Code</title>
  </head>
  <body>
  `+buttons+`
  `+bigdiv+`

  <script>

  function whichCom(id){
    var btn=document.getElementById('btn'+id);
    
    if(btn.innerText=="Hide Commentary"){
      
      document.getElementById(id).style.display="none";
      btn.innerText=btn.className;
    }else{
 
    btn.innerText="Showing Commentary";
    document.getElementById(id).style.display="block";
    btn.innerText="Hide Commentary";
    }
  }
  </script>
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

    // function makeComRow(comm:any):string{

    //   var crow='<tr>'+'<td>'+comm.comm+': ';
    //   comm.comm.map((sc: any,idx:number)=>{
    //     if(idx!==0)
    //     {
    //       crow+=' & ';
    //     }
    //     if(sc.comm!==undefined)
    //     {
    //       var covers=sc.over!==undefined?'('+sc.overs+')':'';
    //       crow+=covers;      
    //     }
    //   });
    //   crow+='</td>'+'</tr>';
    
    //   return crow;
    
    // }
    
    function makeComTable(commentary:any[],id:string) :string
    { 
      
     
      var ctable: string;
      ctable="<table style=\"display:none;\"id="+id+">";
     
      var newcom=[];

      newcom=commentary.comm;
      newcom.map((com: any[])=>{
        var crow=`<tr><td>${com.comm}</td></tr>`
        ctable+=crow
      });
  
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
    