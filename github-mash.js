// ==UserScript==
// @name         GitHub Mash
// @version      0.2.8
// @description  Set your PR default GitHub Merge or Squash button based on where you are merging into
// WIP updating the commit title
// @match https://github.com/*
// @license MIT
// @author robf-github
// @grant none
// ==/UserScript==

(function () {
  'use strict';

  console.log('GitMash loaded');

  // Add custom CSS to style the buttons and summary element
  const style = document.createElement('style');
  style.textContent = `
        .merge-box-button:enabled,
        .js-merge-method-menu-button {
            background-color: #6A0DAD !important; /* Purple */
        }
    `;
  document.head.appendChild(style);

  // Handle the SPA nature of github, listen for navigation changes and act on those.
  window.navigation.addEventListener('navigate', (event) => {
    if (event.navigationType === 'replace') {
      gitMash();
    }
  });

  // Add event listeners to buttons with the specified classes
  document.addEventListener('click', function (event) {
    if (
      event.target.closest(
        'button.btn-group-squash, button.btn-group-merge, button.btn-group-rebase'
      )
    ) {
      const issueTitle = document.querySelector('#issue_title').value;
      const mergeTitleField = document.querySelector('#merge_title_field');
      if (mergeTitleField) {
        mergeTitleField.value = issueTitle;
        console.log('Merge title field updated with ' + issueTitle);
      }
    }
  });

  // Mutation observer to check and click cancel button if expanded
  const observer = new MutationObserver(function (mutations, observer) {
    const cancelButton = document.querySelector('button.js-details-target.btn');
    if (cancelButton && cancelButton.getAttribute('aria-expanded') === 'true') {
      cancelButton.click();
      console.log('Cancel button clicked due to aria-expanded being true.');
      observer.disconnect(); // Stop observing once the button is clicked
    }
  });

  // Start observing the document for changes
  observer.observe(document, { childList: true, subtree: true });
})();

let observer;

function gitMash() {
  console.log('0.2.8');
  if (observer) {
    observer.disconnect();
    observer = undefined;
    console.log('GitMash not listening...');
  }

  if (window.location.href.match('https://github.com/.*?/pull/.*') == null) {
    return;
  }

  console.log(window.location.href);

  const developBranch = 'develop';
  const featureBranchPrefix = 'feature/';

  const baseBranch = document.querySelector('.base-ref').textContent;
  const headBranch = document.querySelector('.head-ref').textContent;

  if (!baseBranch || !headBranch) {
    return;
  }

  let selector;
  if (
    baseBranch === developBranch &&
    headBranch.startsWith(featureBranchPrefix)
  ) {
    selector = '.js-merge-box-button-squash';
  } else {
    selector = '.js-merge-box-button-merge';
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
        console.log('GitMash not listening...');
      }
    });
    console.log('GitMash listening...');
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function selectGitMash(element) {
  console.log(element.textContent + ' selected!');
}
