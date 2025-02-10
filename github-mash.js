// ==UserScript==
// @name         GitHub Mash
// @version      0.2.6
// @description  Set your PR default GitHub Merge or Squash button based on where you are merging into
//               and sets the commit title to be the same as the PR title
// @match https://github.com/*
// @license MIT
// @author robf-github, MitchellQ
// @grant none
// ==/UserScript==

(function () {
  "use strict";

  console.log("GitMash loaded");

  // Add custom CSS to style the buttons and summary element
  const style = document.createElement("style");
  style.textContent = `
        .merge-box-button:enabled,
        .js-merge-method-menu-button {
            background-color: #6A0DAD !important; /* Purple */
        }
    `;
  document.head.appendChild(style);

  // Handle the SPA nature of github, listen for navigation changes and act on those.
  window.navigation.addEventListener("navigate", (event) => {
    if (event.navigationType === "replace") {
      gitMash();
    }
  });
})();

let observer;
let titleObserver;

function gitMash() {
  console.log("0.2.6");
  if (observer) {
    observer.disconnect();
    observer = undefined;
    console.log("GitMash not listening...");
  }

  if (titleObserver) {
    titleObserver.disconnect();
    titleObserver = undefined;
    console.log("Title observer not listening...");
  }

  if (window.location.href.match("https://github.com/.*?/pull/.*") == null) {
    return;
  }

  console.log(window.location.href);

  const developBranch = "develop";
  const featureBranchPrefix = "feature/";

  const baseBranch = document.querySelector(".base-ref").textContent;
  const headBranch = document.querySelector(".head-ref").textContent;

  if (!baseBranch || !headBranch) {
    return;
  }

  setTimeout(() => {
    observeCommitTitleField();
  }, 2000);

  let selector;
  if (
    baseBranch === developBranch &&
    headBranch.startsWith(featureBranchPrefix)
  ) {
    selector = ".js-merge-box-button-squash";
  } else {
    selector = ".js-merge-box-button-merge";
  }

  let element = document.querySelector(selector);

  if (element) {
    selectGitMash(element);
  } else {
    observer = new MutationObserver((_) => {
      let element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        observer = undefined;
        selectGitMash(element);
        console.log("GitMash not listening...");
      }
    });
    console.log("GitMash listening...");
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Observe changes to the PR title and update the commit title accordingly
  const prTitleElement = document.querySelector("#issue_title");
  if (prTitleElement) {
    titleObserver = new MutationObserver(() => {
      updateCommitTitle();
    });
    titleObserver.observe(prTitleElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    console.log("Title observer listening...");
  }
}

function observeCommitTitleField() {
  const commitTitleField = document.querySelector("#merge_title_field");
  if (commitTitleField) {
    updateCommitTitle();
  } else {
    commitTitleObserver = new MutationObserver(() => {
      const commitTitleField = document.querySelector("#merge_title_field");
      if (commitTitleField) {
        commitTitleObserver.disconnect();
        updateCommitTitle();
      }
    });
    commitTitleObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    console.log("Commit title observer listening...");
  }
}

function updateCommitTitle() {
  const prTitle = document.querySelector("#issue_title").value;
  console.log("PR Title = " + prTitle);
  const commitTitleInput = document.querySelector("#merge_title_field");
  console.log("OUT IF Commit Title = " + commitTitleInput);

  if (commitTitleInput) {
    console.log("IF Commit Title = " + commitTitleInput);
    commitTitleInput.value = prTitle;
    console.log(prTitle + " set as commit title!");
  }
}

function selectGitMash(element) {
  //element.click();
  console.log(element.textContent + " selected!");
}
