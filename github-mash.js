// ==UserScript==
// @name         GitHub Mash
// @version      1.0.0
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
        [aria-label="Select merge method"],
        button[data-variant="primary"][data-size="medium"] {
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
})();

let observer;
const baseBranch = document.querySelector('.base-ref').textContent;
const headBranch = document.querySelector('.head-ref').textContent;

function gitMash() {
  console.log('1.2.6');
  if (observer) {
    observer.disconnect();
    observer = undefined;
    console.log('GitMash not listening...');
  }

  if (window.location.href.match('https://github.com/.*?/pull/.*') == null) {
    return;
  }
  console.log(`Current URL: ${window.location.href}`);

  if (!baseBranch || !headBranch) {
    console.warn('Base or head branch not found.');
    return;
  }

  const dropdownSelector = '[aria-label="Select merge method"]';
  const dropdownBtn = document.querySelector(dropdownSelector);
  if (dropdownBtn) {
    openDropDown(dropdownBtn);
  } else {
    observeForElement(dropdownSelector, openDropDown);
  }
}

function openDropDown(element) {
  element.click();
  console.log('Dropdown button clicked.');

  const itemsSelector = '[data-component="ActionList.Item--DividerContainer"]';
  const items = document.querySelectorAll(itemsSelector);
  if (items.length > 1) {
    selectGitMash(items);
  } else {
    observeForElement(itemsSelector, selectGitMash, true);
  }
}

function selectGitMash(elements) {
  const DEVELOP_BRANCH = 'develop';
  const FEATURE_PREFIX = 'feature/';

  let selectionIndex =
    baseBranch === DEVELOP_BRANCH && headBranch.startsWith(FEATURE_PREFIX)
      ? 1
      : 0;
  let method = selectionIndex === 1 ? 'squash' : 'merge';

  console.log(`Selecting merge method: ${method}`);
  const selectedElement = elements[selectionIndex];
  if (selectedElement) {
    console.log('Clicking merge option...');
    selectedElement.click();
  }
}

function observeForElement(selector, callback, selectAll = false) {
  observer = new MutationObserver(() => {
    const elements = selectAll
      ? document.querySelectorAll(selector)
      : document.querySelector(selector);

    if (selectAll ? elements.length > 0 : elements) {
      observer.disconnect();
      observer = null;
      callback(elements);
      console.log(`GitMash stopped listening for ${selector}`);
    }
  });
  console.log(`GitMash listening for ${selector}...`);
  observer.observe(document.body, { childList: true, subtree: true });
}
